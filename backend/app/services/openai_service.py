import os
from typing import List, Optional, Dict, Any
from openai import AsyncOpenAI
from app.core.config import get_settings
from app.models.responses import (
    OpenAIError, 
    EmbeddingError, 
    TokenLimitExceededError, 
    AIQuotaExceededError,
    PromptAugmentationError,
    RAGPipelineError
)

settings = get_settings()

class OpenAIService:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY
        )
        self.embedding_model = settings.OPENAI_EMBEDDING_MODEL
        self.chat_model = settings.OPENAI_MODEL
    
    async def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.7,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate chat completion using OpenAI API"""
        try:
            response = await self.client.chat.completions.create(
                model=model or self.chat_model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                **kwargs
            )
            
            return {
                "content": response.choices[0].message.content,
                "usage": response.usage.dict() if response.usage else None,
                "model": response.model,
                "finish_reason": response.choices[0].finish_reason
            }
            
        except Exception as e:
            if "quota" in str(e).lower():
                raise AIQuotaExceededError(
                    message="OpenAI quota exceeded",
                    details=str(e)
                )
            elif "token" in str(e).lower() and "limit" in str(e).lower():
                raise TokenLimitExceededError(
                    message="Token limit exceeded",
                    details=str(e)
                )
            else:
                raise OpenAIError(
                    message="OpenAI API error",
                    details=str(e)
                )
    
    async def generate_embeddings(
        self,
        texts: List[str],
        model: Optional[str] = None
    ) -> List[List[float]]:
        """Generate embeddings for a list of texts"""
        try:
            # Clean and prepare texts
            cleaned_texts = [str(text).replace("\n", " ").strip() for text in texts if text and str(text).strip()]
            
            if not cleaned_texts:
                raise EmbeddingError(
                    message="No valid texts provided for embedding",
                    details="All provided texts were empty or invalid"
                )
            
            response = await self.client.embeddings.create(
                model=model or self.embedding_model,
                input=cleaned_texts
            )
            
            return [embedding.embedding for embedding in response.data]
            
        except Exception as e:
            if "quota" in str(e).lower():
                raise AIQuotaExceededError(
                    message="OpenAI embedding quota exceeded",
                    details=str(e)
                )
            else:
                raise EmbeddingError(
                    message="Embedding generation failed",
                    details=str(e)
                )
    
    async def generate_single_embedding(
        self,
        text: str,
        model: Optional[str] = None
    ) -> List[float]:
        """Generate embedding for a single text"""
        embeddings = await self.generate_embeddings([text], model)
        return embeddings[0]
    
    async def run_rag_pipeline(
        self,
        user_query: str,
        retrieved_context: List[str],
        context_limit: int = 3000
    ) -> Dict[str, Any]:
        """Execute the RAG pipeline with user query and retrieved context"""
        try:
            # Build the augmented prompt
            context_text = self._build_context_text(retrieved_context, context_limit)
            augmented_prompt = self._create_rag_prompt(user_query, context_text)
            
            messages = [
                {
                    "role": "system",
                    "content": "You are a helpful AI assistant that answers questions based on provided context. Always ground your responses in the given context and cite sources when possible."
                },
                {
                    "role": "user", 
                    "content": augmented_prompt
                }
            ]
            
            response = await self.generate_chat_completion(messages, temperature=0.3)
            
            return {
                "response_text": response["content"],
                "retrieved_sources": retrieved_context,
                "usage": response.get("usage"),
                "model": response.get("model")
            }
            
        except Exception as e:
            raise RAGPipelineError(
                message="RAG pipeline execution failed",
                details=str(e)
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
                message="Failed to build context text",
                details=str(e)
            )
    
    def _create_rag_prompt(self, user_query: str, context_text: str) -> str:
        """Create the final RAG prompt template"""
        template = """Based solely on the context provided below, please answer the user's question. 
If the context does not contain enough information to answer the question, state that clearly.

Context:
{context}

Question: {question}

Please provide a comprehensive answer based on the context above, and indicate which sources (if any) support your response."""

        return template.format(context=context_text, question=user_query)
    
    async def answer_with_web_search(
        self,
        user_query: str,
        web_results: List[str],
        knowledge_base_context: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Answer query using both web search results and knowledge base context"""
        try:
            # Combine contexts
            all_context = []
            
            if knowledge_base_context:
                all_context.extend(knowledge_base_context)
            
            if web_results:
                all_context.extend(web_results)
            
            if not all_context:
                # Fallback to direct LLM response
                messages = [
                    {
                        "role": "system",
                        "content": "You are a helpful AI assistant. Answer the user's question to the best of your knowledge."
                    },
                    {
                        "role": "user",
                        "content": user_query
                    }
                ]
                
                response = await self.generate_chat_completion(messages)
                
                return {
                    "response_text": response["content"],
                    "retrieved_sources": [],
                    "web_sources": web_results,
                    "usage": response.get("usage"),
                    "model": response.get("model")
                }
            
            # Use RAG pipeline with combined context
            return await self.run_rag_pipeline(user_query, all_context)
            
        except Exception as e:
            raise RAGPipelineError(
                message="Web search enhanced RAG failed",
                details=str(e)
            )

# Singleton instance
openai_service = OpenAIService()
