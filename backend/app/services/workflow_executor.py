from typing import Dict, Any, List, Optional
from app.services.web_search_service import WebSearchService
from app.utils.errors import (
    WorkflowExecutionError,
    InvalidWorkflowError,
    RAGPipelineError,
)
from app.utils.logger import log


class WorkflowExecutor:
    """
    Orchestrates the execution of RAG workflows defined by React Flow diagrams or simple string workflows
    """

    def __init__(self):
        self.supported_components = {
            "userQuery",
            "knowledgeBase",
            "llmEngine",
            "output",
            "webSearch",
        }

    async def execute_workflow(
        self,
        user_query: str,
        workflow_definition: str,
        project_config: Dict[str, Any],
        conversation_history: Optional[List[Dict[str, str]]] = None,
        session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Execute a simple workflow from string definition (e.g., 'kb_llm', 'web_llm_kb', etc.)"""
        try:
            # Parse workflow string to determine execution order
            workflow_parts = workflow_definition.split("_")
            
            # Validate workflow parts
            valid_parts = {"kb", "llm", "web"}
            if not all(part in valid_parts for part in workflow_parts):
                raise InvalidWorkflowError(
                    message=f"Invalid workflow definition: {workflow_definition}",
                    details=f"Valid parts are: {valid_parts}"
                )

            # Create configured service instances based on project config
            configured_services = self._create_configured_services(project_config)

            # Initialize execution context
            context = {
                "user_query": user_query,
                "retrieved_context": [],
                "web_results": [],
                "final_response": "",
                "sources": [],
                "execution_log": [],
                "conversation_history": conversation_history or [],
                "workflow_steps_executed": [],
            }

            # Execute workflow steps in order
            for step in workflow_parts:
                if step == "kb":
                    if not (project_config.get("chromadb_chunk_ids") and len(project_config.get("chromadb_chunk_ids")) > 0):
                        raise InvalidWorkflowError(
                            message="No documents found",
                            details="Please add documents to the knowledge base or modify the workflow to exclude the knowledge base step"
                        )
                    context = await self._execute_kb_step(context, configured_services)
                    context["workflow_steps_executed"].append("kb")
                elif step == "llm":
                    context = await self._execute_llm_step(context, configured_services)
                    context["workflow_steps_executed"].append("llm")
                elif step == "web":
                    context = await self._execute_web_step(context, configured_services)
                    context["workflow_steps_executed"].append("web")

            return {
                "response_text": context["final_response"],
                "retrieved_sources": context["sources"],
                "execution_log": context["execution_log"],
                "session_id": session_id,
            }

        except Exception as e:
            log("Workflow Execution Error", {e})
            if isinstance(e, (InvalidWorkflowError, RAGPipelineError)):
                raise
            raise WorkflowExecutionError(
                message="Simple workflow execution failed", details=str(e)
            )

    def _create_configured_services(self, project_config: Dict[str, Any]) -> Dict[str, Any]:
        """Create pre-configured service instances with API keys and models from project config"""
        from app.services.llm_service import LLMService
        from app.services.knowledge_base import KnowledgeBaseService
        from app.services.web_search_service import WebSearchService
        
        services = {}
        
        # Create configured LLM service instance
        llm_config = project_config.get("llm_node", {})
        if llm_config:
            api_key = llm_config.get("openai_api_key")
            model = llm_config.get("llm_model_name")
            if api_key and model:
                services["llm_service"] = LLMService(api_key=api_key, model=model)
        
        # Create configured Knowledge Base service instance
        kb_config = project_config.get("knowledge_base_node", {})
        if kb_config:
            api_key = kb_config.get("openai_api_key")
            model = kb_config.get("embedding_model_name")
            if api_key and model:
                services["knowledge_base_service"] = KnowledgeBaseService(api_key=api_key, model=model, vector_collection=model)
        
        # Create configured Web Search service instance
        web_config = project_config.get("web_search_node", {})
        if web_config:
            serpapi_api_key = web_config.get("serpapi_api_key")
            if serpapi_api_key:
                services["web_search_service"] = WebSearchService(serpapi_api_key=serpapi_api_key)
        
        # Pass through additional project data
        services["chromadb_chunk_ids"] = project_config.get("chromadb_chunk_ids", [])
        services["project_id"] = project_config.get("project_id")
        
        # log("Configured Services", f"Services configured: {list(services.values())}")
        
        return services

    async def _execute_kb_step(
        self, context: Dict[str, Any], configured_services: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute knowledge base retrieval step with configured service"""
        try:
            context["execution_log"].append("Executing Knowledge Base retrieval")
            
            # Get configured KB service instance
            kb_service_instance = configured_services.get("knowledge_base_service")
            
            # Get document chunk IDs for the project
            chromadb_chunk_ids = configured_services.get("chromadb_chunk_ids", [])
            
            if chromadb_chunk_ids:
                # Retrieve relevant context using configured service
                relevant_chunks = await kb_service_instance.retrieve_relevant_context_by_ids(
                    query=context["user_query"],
                    chromadb_chunk_ids=chromadb_chunk_ids,
                    n_results=5,
                )
                
                # Extract text and sources
                context["retrieved_context"] = [chunk["text"] for chunk in relevant_chunks]
                context["sources"].extend([
                    {
                        "type": "knowledge_base",
                        "source": chunk.get("text", "Unknown"),
                        "similarity": chunk.get("similarity", 0.0),
                    }
                    for chunk in relevant_chunks
                ])
                
                context["execution_log"].append(f"Retrieved {len(relevant_chunks)} relevant chunks from knowledge base")
            else:
                raise ValueError("No documents found in knowledge base")

            return context

        except Exception as e:
            raise RAGPipelineError(
                message="Knowledge base step execution failed", details=str(e)
            )

    async def _execute_web_step(
        self, context: Dict[str, Any], configured_services: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute web search step with configured service"""
        try:
            context["execution_log"].append("Executing Web search")
            
            # Get configured Web Search service instance
            web_search_service_instance = configured_services.get("web_search_service")
            if not web_search_service_instance:
                context["execution_log"].append("Web search not configured - skipping")
                return context

            # Perform web search
            search_results = web_search_service_instance.search(
                query=context["user_query"],
            )
            
            # Extract relevant information from search results
            web_context = []
            for result in search_results[:5]:  # Limit to top 5 results
                title = result.get("title", "")
                snippet = result.get("snippet", "")
                link = result.get("link", "")

                if title and snippet:
                    web_context.append(f"Title: {title}\nContent: {snippet}\nSource: {link}")
                    context["sources"].append({
                        "type": "web_search",
                        "source": link,
                        "title": title,
                    })

            context["web_results"] = web_context
            context["execution_log"].append(f"Retrieved {len(web_context)} web search results")

            return context

        except Exception as e:
            raise RAGPipelineError(
                message="Web search step execution failed", details=str(e)
            )

    async def _execute_llm_step(
        self, context: Dict[str, Any], configured_services: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute LLM generation step with configured service"""
        try:
            context["execution_log"].append("Executing LLM generation")
            
            # Get configured LLM service instance
            llm_service_instance = configured_services.get("llm_service")
            
            # log("LLM Service Instance", f"LLM Service: {llm_service_instance}")
            
            if not llm_service_instance:
                raise ValueError("LLM service not configured for this project")
            
            # Prepare all available context
            all_context = context["retrieved_context"].copy()
            if context["web_results"]:
                all_context.extend(context["web_results"])

            # Prepare workflow context to inform LLM about which steps were attempted
            workflow_context = {
                "kb_attempted": "kb" in context.get("workflow_steps_executed", []),
                "web_attempted": "web" in context.get("workflow_steps_executed", []),
            }

            # Use RAG pipeline with context and workflow information
            result = await llm_service_instance.run_rag_pipeline(
                user_query=context["user_query"],
                retrieved_context=all_context,
                conversation_history=context["conversation_history"],
                workflow_context=workflow_context,
            )
            context["final_response"] = result["response_text"]
            context["execution_log"].append(f"Generated RAG response using {len(all_context)} context sources")
            return context

        except Exception as e:
            raise RAGPipelineError(
                message="LLM step execution failed", details=str(e)
            )

   
    async def _execute_output_node(
        self, context: Dict[str, Any], config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute output formatting"""
        try:
            # Output node just formats the final response
            # Could add formatting options here

            format_type = config.get("format", "text")
            include_sources = config.get("include_sources", True)

            if format_type == "markdown" and include_sources and context["sources"]:
                # Add sources to response
                sources_text = "\n\n**Sources:**\n"
                for i, source in enumerate(context["sources"][:3], 1):  # Limit to top 3
                    sources_text += f"{i}. {source['source']} (similarity: {source['similarity']:.2f})\n"

                context["final_response"] += sources_text

            context["execution_log"].append("Output formatted")

            return context

        except Exception as e:
            raise RAGPipelineError(
                message="Output node execution failed", details=str(e)
            )


# Singleton instance
workflow_executor = WorkflowExecutor()
