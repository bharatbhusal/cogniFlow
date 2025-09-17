from typing import List, Optional, Dict, Any
from openai import AsyncOpenAI
import openai
from app.config.env import get_settings
from app.utils.errors import (
    OpenAIError,
    TokenLimitExceededError,
    AIQuotaExceededError,
    PromptAugmentationError,
    RAGPipelineError,
)
from app.utils.logger import log

settings = get_settings()


class LLMService:
    def __init__(self, api_key: str, model: str):
        """Initialize LLM service with required API key and model"""
        if not api_key:
            raise ValueError("OpenAI API key is required")
        if not model:
            raise ValueError("LLM model is required")
            
        self.api_key = api_key
        self.model = model
        self.openai_client = AsyncOpenAI(api_key=api_key)
    
    async def validate_key_and_model(self) -> Dict[str, Any]:
        """Validate the API key and model asynchronously"""
        return  self._is_llm_model(self.model) and  await self._validate_api_key()

    def _is_llm_model(self, model: str) -> bool:
        """
        Check if the given model is a valid LLM/text generation model.
        
        Args:
            model: The model name to check
            
        Returns:
            bool: True if model is a text generation model, False otherwise
        """
        # Supported text generation models
        text_models = {
            # GPT-4 family
            "gpt-4", "gpt-4-0613", "gpt-4-32k", "gpt-4-32k-0613",
            "gpt-4-turbo", "gpt-4-turbo-preview", "gpt-4-0125-preview", "gpt-4-1106-preview",
            "gpt-4o", "gpt-4o-mini", "gpt-4o-2024-05-13", "gpt-4o-2024-08-06",
            
            # GPT-3.5 family
            "gpt-3.5-turbo", "gpt-3.5-turbo-0613", "gpt-3.5-turbo-16k", "gpt-3.5-turbo-16k-0613",
            "gpt-3.5-turbo-0125", "gpt-3.5-turbo-1106",
            
            # Legacy models
            "text-davinci-003", "text-davinci-002", "davinci", "curie", "babbage", "ada"
        }
        
        if model in text_models:
            return True
        else:
            raise OpenAIError(
                message="Invalid text generation model",
                details=f"Model '{model}' is not a recognized text generation model"
            )

        
    async def _validate_api_key(self) -> Dict[str, Any]:
        """
        Validate OpenAI API key and model by calling OpenAI API.
        
        Args:
            api_key: OpenAI API key to validate
            model: Model name to validate
            
        Returns:
            Dict containing validation results
            
        Raises:
            OpenAIError: If API key is invalid
            ModelNotFoundError: If model doesn't exist or isn't accessible
            ValueError: If model is not a text generation model
        """
        try:
            return True if  await self.openai_client.models.retrieve(self.model) else False
        except Exception as e:
            # Unexpected error
            raise OpenAIError(
                message="Invalid OpenAI API key",
                details=f"Error validating OpenAI API key: {str(e)}"
            )
        
    def _supports_temperature(self, model: str) -> bool:
        """
        Check if the given model supports temperature parameter.
        
        Args:
            model: The model name to check
            
        Returns:
            bool: True if model supports temperature, False otherwise
        """
        # Models that support temperature parameter
        temperature_supported_models = {
            # GPT-4 family
            "gpt-4", "gpt-4-0613", "gpt-4-32k", "gpt-4-32k-0613",
            "gpt-4-turbo", "gpt-4-turbo-preview", "gpt-4-0125-preview", "gpt-4-1106-preview",
            "gpt-4o", "gpt-4o-mini", "gpt-4o-2024-05-13", "gpt-4o-2024-08-06",
            
            # GPT-3.5 family
            "gpt-3.5-turbo", "gpt-3.5-turbo-0613", "gpt-3.5-turbo-16k", "gpt-3.5-turbo-16k-0613",
            "gpt-3.5-turbo-0125", "gpt-3.5-turbo-1106",
            
            # Legacy models
            "text-davinci-003", "text-davinci-002", "davinci", "curie", "babbage", "ada"
        }
        
        # Non-text models that don't support temperature (not applicable for LLMService)
        temperature_not_supported = set()
        
        # Check exact matches first
        if model in temperature_supported_models:
            return True
        if model in temperature_not_supported:
            return False
            
        # Check for partial matches (for custom fine-tuned models or new versions)
        model_lower = model.lower()
        
        # GPT models generally support temperature (text models only)
        if any(prefix in model_lower for prefix in ["gpt-4", "gpt-3.5", "gpt-3", "text-davinci", "davinci"]):
            return True
            
        # Default to True for unknown models (LLMService should handle text models)
        return True
        
    def _prepare_chat_completion_params(self, messages: List[Dict[str, str]], temperature: float, **kwargs) -> Dict[str, Any]:
        """
        Prepare parameters for chat completion, conditionally including temperature.
        
        Args:
            messages: List of conversation messages
            temperature: Desired temperature value
            **kwargs: Additional parameters
            
        Returns:
            Dict of parameters to pass to the API call
        """
        # Filter out None values from kwargs
        filtered_kwargs = {k: v for k, v in kwargs.items() if v is not None}
        
        params = {
            "model": self.model,
            "messages": messages,
            **filtered_kwargs
        }
        
        # Only include temperature if the model supports it
        if self._supports_temperature(self.model):
            params["temperature"] = temperature
            log("LLMService", f"Using temperature {temperature} for model {self.model}")
        else:
            log("LLMService", f"Model {self.model} does not support temperature parameter, using default")
            
        return params
        
    def get_model_capabilities(self) -> Dict[str, Any]:
        """
        Get capabilities information for the current model.
        
        Returns:
            Dict containing model capabilities information
        """
        return {
            "model": self.model,
            "supports_temperature": self._supports_temperature(self.model),
            "model_family": self._get_model_family(self.model),
            "recommended_temperature_range": self._get_temperature_range(self.model)
        }
        
    def _get_model_family(self, model: str) -> str:
        """Get the model family for the given model (text models only)."""
        model_lower = model.lower()
        
        if "gpt-4o" in model_lower:
            return "gpt-4o"
        elif "gpt-4" in model_lower:
            return "gpt-4"
        elif "gpt-3.5" in model_lower:
            return "gpt-3.5-turbo"
        elif "text-davinci" in model_lower:
            return "text-davinci"
        elif any(name in model_lower for name in ["davinci", "curie", "babbage", "ada"]):
            return "legacy-gpt"
        else:
            return "unknown"
            
    def _get_temperature_range(self, model: str) -> Dict[str, float]:
        """Get recommended temperature range for the model."""
        if not self._supports_temperature(model):
            return {"min": None, "max": None, "default": None}
            
        # Most chat models support 0.0 to 2.0
        return {
            "min": 0.0,
            "max": 2.0,
            "default": 1.0,
            "recommended_creative": 0.9,
            "recommended_factual": 0.1
        }
        
    async def generate_chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7, 
        **kwargs
    ) -> Dict[str, Any]:
        """Generate chat completion using OpenAI API with model-aware temperature handling"""
        try:
            # Prepare parameters with conditional temperature support
            params = self._prepare_chat_completion_params(messages, temperature, **kwargs)
            
            response = await self.openai_client.chat.completions.create(**params)
            log("Response", str(response))

            return {
                "content": response.choices[0].message.content,
                "usage": response.usage.dict() if response.usage else None,
                "model": response.model,
                "finish_reason": response.choices[0].finish_reason,
            }
        except openai.RateLimitError as e:
            #Handle rate limit error (we recommend using exponential backoff)
            log("OpenAI Error", e)
            raise OpenAIError(message="Rate limit exceeded", details=str(e))
        except openai.BadRequestError as e:
            #Handle bad request error (e.g., invalid parameters)
            log("OpenAI Error", e)
            error_message = str(e)
            
            # Check if error is related to unsupported temperature parameter
            if "temperature" in error_message.lower() and ("not supported" in error_message.lower() or "invalid" in error_message.lower()):
                # Retry without temperature if it was the issue
                log("OpenAI Error", f"Temperature not supported for model {self.model}, retrying without temperature")
                try:
                    params_no_temp = self._prepare_chat_completion_params(messages, temperature, **kwargs)
                    if "temperature" in params_no_temp:
                        del params_no_temp["temperature"]
                    response = await self.openai_client.chat.completions.create(**params_no_temp)
                    log("Response", "Successfully completed after removing temperature parameter")
                    return {
                        "content": response.choices[0].message.content,
                        "usage": response.usage.dict() if response.usage else None,
                        "model": response.model,
                        "finish_reason": response.choices[0].finish_reason,
                    }
                except Exception as retry_e:
                    log("OpenAI Error", f"Retry without temperature also failed: {retry_e}")
                    raise OpenAIError(message="Bad request error", details=str(e))
            else:
                raise OpenAIError(message="Bad request error", details=str(e))
        except Exception as e:
            log("OpenAI Error", str(e))
            if "quota" in str(e).lower():
                raise AIQuotaExceededError(
                    message="OpenAI quota exceeded", details=str(e)
                )
            elif "maximum context length" in str(e).lower() or "token limit" in str(e).lower():
                raise TokenLimitExceededError(
                    message="Token limit exceeded", details=str(e)
                )
            else:
                error_details = str(e)
                if hasattr(e, 'error') and hasattr(e.error, 'message'):
                    error_details = str(e.error.message)
                raise OpenAIError(message="OpenAI API error", details=error_details)
        
    async def run_rag_pipeline(
        self,
        user_query: str,
        retrieved_context: Optional[List[str]],
        conversation_history: Optional[List[Dict[str, str]]] = None,
        context_limit: int = 3000,
        workflow_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Execute the RAG pipeline with user query, retrieved context, and conversation history"""
        try:
            # Determine the optimal prompt structure based on available context and history
            messages = self._build_customized_messages(
                user_query=user_query,
                retrieved_context=retrieved_context,
                conversation_history=conversation_history,
                context_limit=context_limit,
                workflow_context=workflow_context
            )

            # Adjust temperature based on context availability
            # Lower temperature for context-based responses for accuracy
            # Slightly higher for general knowledge responses for creativity
            temperature = 0.2 if retrieved_context else 0.5

            response = await self.generate_chat_completion(
                messages, 
                temperature=temperature
            )

            return {
                "response_text": response["content"],
                "retrieved_sources": retrieved_context or [],
                "usage": response.get("usage"),
                "model": response.get("model"),
                "context_used": bool(retrieved_context),
                "history_used": bool(conversation_history),
            }

        except Exception as e:
            raise RAGPipelineError(
                message="RAG pipeline execution failed", details=str(e)
            )

    def _build_customized_messages(
        self,
        user_query: str,
        retrieved_context: Optional[List[str]],
        conversation_history: Optional[List[Dict[str, str]]],
        context_limit: int,
        workflow_context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, str]]:
        """Build customized message structure based on available context and conversation history"""
        
        # Extract workflow information
        kb_attempted = workflow_context.get("kb_attempted", False) if workflow_context else False
        web_attempted = workflow_context.get("web_attempted", False) if workflow_context else False
        
        # Scenario 1: No context, no history - Check if steps were attempted
        if not retrieved_context and not conversation_history:
            # If KB or Web steps were attempted but returned no results
            if kb_attempted or web_attempted:
                attempted_sources = []
                if kb_attempted:
                    attempted_sources.append("knowledge base")
                if web_attempted:
                    attempted_sources.append("web search")
                    
                sources_text = " and ".join(attempted_sources)
                return [
                    {
                        "role": "system",
                        "content": f"""You are an AI assistant that was asked to search {sources_text} for relevant information, but no relevant context was found in these sources for the user's query. 

IMPORTANT: Since the {sources_text} search returned no relevant results, you should clearly state this and explain that you cannot provide a comprehensive answer based on the available sources. Do NOT use your general knowledge to fully answer the question, as the user specifically chose to search these sources.

Please inform the user that no relevant information was found in the {sources_text} and suggest:
1. Rephrasing the question
2. Adding more relevant documents to the knowledge base (if applicable)
3. Trying different search terms
4. Or using a different workflow that includes general knowledge""",
                    },
                    {
                        "role": "user",
                        "content": user_query,
                    },
                ]
            # Pure general knowledge mode - no sources were attempted
            else:
                return [
                    {
                        "role": "system",
                        "content": """You are a helpful AI assistant. Since no specific context or conversation history was provided, you can use your general knowledge to answer the question. Please indicate that your answer is based on general knowledge and suggest adding relevant documents for more specific information.""",
                    },
                    {
                        "role": "user",
                        "content": user_query,
                    },
                ]
        
        # Scenario 2: Context available, no history - Context-only RAG mode
        elif retrieved_context and not conversation_history:
            context_text = self._build_context_text(retrieved_context, context_limit)
            return [
                {
                    "role": "system",
                    "content": f"""You are an AI assistant specialized in answering questions using provided context documents. 

STRICT GUIDELINES:
1) Base your answer ONLY on the information from the context below
2) If the context lacks sufficient information, clearly state: "The provided context doesn't contain enough information to fully answer this question. Please add more relevant documents."
3) Do NOT use external knowledge beyond the context
4) Reference specific sources when possible
5) Be precise and factual

CONTEXT DOCUMENTS:
{context_text}

Please answer the question using only the above context.""",
                },
                {"role": "user", "content": user_query},
            ]
        
        # Scenario 3: No context, but has history - Conversational mode with memory
        elif not retrieved_context and conversation_history:
            # Check if KB or Web steps were attempted but returned no results
            if kb_attempted or web_attempted:
                attempted_sources = []
                if kb_attempted:
                    attempted_sources.append("knowledge base")
                if web_attempted:
                    attempted_sources.append("web search")
                    
                sources_text = " and ".join(attempted_sources)
                conversation_history_text = self._build_conversation_history_text(
                    conversation_history, max_exchanges=10
                )
                
                return [
                    {
                        "role": "system",
                        "content": f"""You are an AI assistant engaged in a conversation. The {sources_text} search was attempted but returned no relevant results for this query.

{conversation_history_text}

IMPORTANT: Since the {sources_text} search returned no relevant results, you should:
1) Acknowledge that the search in {sources_text} found no relevant information
2) Reference our conversation history to maintain context
3) Provide a helpful response while noting the limitation of the search results
4) Suggest alternative approaches like rephrasing the question or adding more relevant documents (if applicable)

Please consider the above conversation history when responding to maintain continuity.""",
                    },
                    {
                        "role": "user",
                        "content": user_query
                    }
                ]
            # Pure conversational mode - no sources were attempted
            else:
                # Build conversation history text to include in system message
                conversation_history_text = self._build_conversation_history_text(
                    conversation_history, max_exchanges=10
                )
                
                return [
                    {
                        "role": "system",
                        "content": f"""You are a helpful AI assistant engaged in a conversation. Use the conversation history to maintain context and provide relevant responses. Since no specific documents are provided, you may use your general knowledge while being mindful of the ongoing conversation.

{conversation_history_text}

Please consider the above conversation history when responding to maintain continuity and context.""",
                    },
                    {
                        "role": "user",
                        "content": user_query
                    }
                ]
        
        # Scenario 4: Both context and history - Full RAG with conversational awareness
        else:
            context_text = self._build_context_text(retrieved_context, context_limit)
            conversation_history_text = self._build_conversation_history_text(
                conversation_history, max_exchanges=8
            )
            
            return [
                {
                    "role": "system",
                    "content": f"""You are an AI assistant that answers questions using both provided context documents and conversation history for continuity.

PRIORITY GUIDELINES:
1) PRIMARY: Use information from the context documents below
2) SECONDARY: Reference conversation history for continuity and understanding
3) If context is insufficient, state: "The provided context doesn't fully address this question based on our conversation. Please add more relevant documents."
4) Maintain conversational flow while staying grounded in the provided context
5) Reference previous exchanges when relevant

CONTEXT DOCUMENTS:
{context_text}

{conversation_history_text}

Use both the context above and our conversation history to provide a comprehensive answer.""",
                },
                {
                    "role": "user",
                    "content": user_query
                }
            ]

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

    def _get_recent_conversation_history(
        self, 
        conversation_history: Optional[List[Dict[str, str]]], 
        max_exchanges: int = 10
    ) -> List[Dict[str, str]]:
        """
        Parse conversation history and return the last N conversation exchanges.
        
        Args:
            conversation_history: List of conversation messages with 'role' and 'content'
            max_exchanges: Maximum number of recent exchanges to return (default: 10)
            
        Returns:
            List of recent conversation messages, maintaining chronological order
        """
        try:
            if not conversation_history:
                return []
            
            # Ensure we have a valid list
            if not isinstance(conversation_history, list):
                raise ValueError("Conversation history must be a list")
            
            # Validate message format
            for i, msg in enumerate(conversation_history):
                if not isinstance(msg, dict):
                    raise ValueError(f"Message at index {i} must be a dictionary")
                if "role" not in msg or "content" not in msg:
                    raise ValueError(f"Message at index {i} must have 'role' and 'content' fields")
                if msg["role"] not in ["user", "assistant"]:
                    raise ValueError(f"Message at index {i} has invalid role: {msg['role']}. Must be 'user' or 'assistant'")
            
            # Get the last N exchanges, maintaining chronological order
            if len(conversation_history) <= max_exchanges:
                return conversation_history.copy()
            else:
                return conversation_history[-max_exchanges:]
                
        except Exception as e:
            raise PromptAugmentationError(
                message=f"Failed to parse conversation history", 
                details=f"Error processing conversation history: {str(e)}"
            )

    def _build_conversation_history_text(
        self, 
        conversation_history: Optional[List[Dict[str, str]]], 
        max_exchanges: int = 10
    ) -> str:
        """
        Build formatted conversation history text from recent conversations.
        
        Args:
            conversation_history: List of conversation messages
            max_exchanges: Maximum number of recent exchanges to include
            
        Returns:
            Formatted conversation history text
        """
        try:
            if not conversation_history:
                return ""
            
            # Get recent conversation history
            recent_history = self._get_recent_conversation_history(conversation_history, max_exchanges)
            
            if not recent_history:
                return ""
            
            # Build formatted history text
            history_text = "RECENT CONVERSATION:\n"
            for msg in recent_history:
                role_label = "Human" if msg["role"] == "user" else "Assistant"
                history_text += f"{role_label}: {msg['content']}\n"
            
            return history_text.strip()
            
        except Exception as e:
            raise PromptAugmentationError(
                message="Failed to build conversation history text", 
                details=str(e)
            )

    async def answer_with_web_search(
        self,
        user_query: str,
        web_results: List[str],
        knowledge_base_context: Optional[List[str]] = None,
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
                    messages
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
                all_context
            )

        except Exception as e:
            raise RAGPipelineError(
                message="Web search enhanced RAG failed", details=str(e)
            )