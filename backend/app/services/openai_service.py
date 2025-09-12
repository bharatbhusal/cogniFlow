from typing import List, Optional, Dict, Any
from openai import AsyncOpenAI
from app.config.env import get_settings
from app.utils.errors import (
    OpenAIError,
    EmbeddingError,
    TokenLimitExceededError,
    AIQuotaExceededError,
    PromptAugmentationError,
    RAGPipelineError,
)

settings = get_settings()


class OpenAIService:
    def __init__(self):
        # Default client for backward compatibility (fallback to env settings)
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.embedding_model = "text-embedding-ada-002"
        self.llm_model = "gpt-3.5-turbo"

    def _get_client(self, api_key: Optional[str] = None) -> AsyncOpenAI:
        """Get OpenAI client with specified API key or default"""
        if api_key:
            return AsyncOpenAI(api_key=api_key)
        return self.client

    async def generate_chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7, 
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate chat completion using OpenAI API with optional custom API key"""
        try:
            client = self._get_client(api_key)
            used_model = model or self.llm_model
            
            response = await client.chat.completions.create(
                model=used_model,
                messages=messages,
                temperature=temperature,
                **kwargs,
            )

            return {
                "content": response.choices[0].message.content,
                "usage": response.usage.dict() if response.usage else None,
                "model": response.model,
                "finish_reason": response.choices[0].finish_reason,
            }

        except Exception as e:
            if "quota" in str(e).lower():
                raise AIQuotaExceededError(
                    message="OpenAI quota exceeded", details=str(e)
                )
            elif "token" in str(e).lower() and "limit" in str(e).lower():
                raise TokenLimitExceededError(
                    message="Token limit exceeded", details=str(e)
                )
            else:
                raise OpenAIError(message="OpenAI API error", details=str(e))

    async def generate_embeddings(
        self,
        texts: List[str],
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ) -> List[List[float]]:
        """Generate embeddings for a list of texts with optional custom API key"""
        try:
            # Clean and prepare texts
            cleaned_texts = [
                str(text).replace("\n", " ").strip()
                for text in texts
                if text and str(text).strip()
            ]

            if not cleaned_texts:
                raise EmbeddingError(
                    message="No valid texts provided for embedding",
                    details="All provided texts were empty or invalid",
                )

            client = self._get_client(api_key)
            used_model = model or self.embedding_model
            
            response = await client.embeddings.create(
                model=used_model, input=cleaned_texts
            )

            return [embedding.embedding for embedding in response.data]

        except Exception as e:
            if "quota" in str(e).lower():
                raise AIQuotaExceededError(
                    message="OpenAI embedding quota exceeded", details=str(e)
                )
            else:
                raise EmbeddingError(
                    message="Embedding generation failed", details=str(e)
                )

    async def generate_single_embedding(
        self,
        text: str,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ) -> List[float]:
        """Generate embedding for a single text with optional custom API key"""
        embeddings = await self.generate_embeddings([text], api_key=api_key, model=model)
        return embeddings[0]

    async def run_rag_pipeline(
        self,
        user_query: str,
        retrieved_context: List[str],
        conversation_history: Optional[List[Dict[str, str]]] = None,
        context_limit: int = 3000,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Execute the RAG pipeline with user query, retrieved context, and conversation history using custom API key"""
        try:
            # Build the augmented prompt
            context_text = self._build_context_text(retrieved_context, context_limit)
            augmented_prompt = self._create_rag_prompt(
                user_query, context_text, conversation_history
            )

            messages = [
                {
                    "role": "system",
                    "content": "You are an AI assistant that ONLY answers questions using the provided context. IMPORTANT RULES: 1) You must ONLY use information from the context provided. 2) If the context doesn't contain sufficient information to answer the question, you must say 'I cannot answer this question based on the provided context. Please add more relevant documents.' 3) Do NOT use your general knowledge or training data. 4) Do NOT make assumptions or inferences beyond what is explicitly stated in the context.",
                },
                {"role": "user", "content": augmented_prompt},
            ]

            response = await self.generate_chat_completion(
                messages, 
                temperature=0.3,
                api_key=api_key,
                model=model
            )

            return {
                "response_text": response["content"],
                "retrieved_sources": retrieved_context,
                "usage": response.get("usage"),
                "model": response.get("model"),
            }

        except Exception as e:
            raise RAGPipelineError(
                message="RAG pipeline execution failed", details=str(e)
            )

    def _build_context_text(self, context_chunks: List[str], limit: int) -> str:
        """Build context text from retrieved chunks with character limit"""
        try:
            context_text = ""
            for i, chunk in enumerate(context_chunks):
                chunk_with_header = f"\n--- Source {i+1} ---\n{chunk}\n"

                if len(context_text + chunk_with_header) > limit:
                    break

                context_text += chunk_with_header

            return context_text.strip()

        except Exception as e:
            raise PromptAugmentationError(
                message="Failed to build context text", details=str(e)
            )

    def _create_rag_prompt(
        self,
        user_query: str,
        context_text: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        """Create the final RAG prompt template with conversation history"""

        # Build conversation history section
        history_text = ""
        if conversation_history:
            history_text = "\nCONVERSATION HISTORY:\n"
            for msg in conversation_history:
                role_label = "Human" if msg["role"] == "user" else "Assistant"
                history_text += f"{role_label}: {msg['content']}\n"
            history_text += "\n"

        template = """CONTEXT INFORMATION:
{context}
{history}
INSTRUCTIONS: Answer the following question using ONLY the information provided in the context above. Consider the conversation history for context, but do not use any external knowledge or make assumptions. If the context doesn't contain enough information to answer the question completely, clearly state what information is missing.

QUESTION: {question}

ANSWER (using only the context and conversation history above):"""

        return template.format(
            context=context_text, history=history_text, question=user_query
        )

    async def answer_with_web_search(
        self,
        user_query: str,
        web_results: List[str],
        knowledge_base_context: Optional[List[str]] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Answer query using both web search results and knowledge base context with custom API key"""
        try:
            # Combine contexts
            all_context = []

            if knowledge_base_context:
                all_context.extend(knowledge_base_context)

            if web_results:
                all_context.extend(web_results)

            if not all_context:
                # Fallback to direct LLM response with clear limitation
                messages = [
                    {
                        "role": "system",
                        "content": "You are a helpful AI assistant. Since no specific context was provided, you can use your general knowledge to answer the question, but please indicate that your answer is based on general knowledge and not specific documents.",
                    },
                    {
                        "role": "user",
                        "content": f"No specific context was provided. Using general knowledge, please answer: {user_query}",
                    },
                ]

                response = await self.generate_chat_completion(
                    messages, 
                    api_key=api_key, 
                    model=model
                )

                return {
                    "response_text": response["content"],
                    "retrieved_sources": [],
                    "web_sources": web_results,
                    "usage": response.get("usage"),
                    "model": response.get("model"),
                }

            # Use RAG pipeline with combined context
            return await self.run_rag_pipeline(
                user_query, 
                all_context, 
                api_key=api_key, 
                model=model
            )

        except Exception as e:
            raise RAGPipelineError(
                message="Web search enhanced RAG failed", details=str(e)
            )


# Singleton instance
openai_service = OpenAIService()
