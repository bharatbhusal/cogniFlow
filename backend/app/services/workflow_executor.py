from typing import Dict, Any, List, Optional
from app.services.openai_service import openai_service
from app.services.knowledge_base import knowledge_base_service
from app.types.responses import (
    WorkflowExecutionError,
    WorkflowParsingError,
    InvalidWorkflowError,
    RAGPipelineError
)

class WorkflowExecutor:
    """
    Orchestrates the execution of RAG workflows defined by React Flow diagrams
    """
    
    def __init__(self):
        self.supported_components = {
            "userQuery", 
            "knowledgeBase", 
            "llmEngine", 
            "output",
            "webSearch"
        }
    
    async def execute_workflow(
        self,
        user_query: str,
        workflow_definition: Dict[str, Any],
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute a complete workflow from React Flow definition"""
        try:
            # Parse and validate workflow
            parsed_workflow = self._parse_workflow_definition(workflow_definition)
            
            # Execute the RAG pipeline based on workflow configuration
            result = await self._execute_rag_pipeline(
                user_query=user_query,
                workflow_config=parsed_workflow,
                session_id=session_id
            )
            
            return result
            
        except Exception as e:
            if isinstance(e, (WorkflowParsingError, InvalidWorkflowError, RAGPipelineError)):
                raise
            raise WorkflowExecutionError(
                message="Workflow execution failed",
                details=str(e)
            )
    
    def _parse_workflow_definition(self, workflow_def: Dict[str, Any]) -> Dict[str, Any]:
        """Parse React Flow workflow definition into execution config"""
        try:
            nodes = workflow_def.get("nodes", [])
            edges = workflow_def.get("edges", [])
            
            if not nodes:
                raise InvalidWorkflowError(
                    message="Workflow must contain at least one node",
                    details="Empty workflow definition provided"
                )
            
            # Extract node configurations
            config = {
                "nodes": {},
                "execution_order": [],
                "connections": {}
            }
            
            for node in nodes:
                node_type = node.get("type")
                node_id = node.get("id")
                node_data = node.get("data", {})
                
                if node_type not in self.supported_components:
                    raise InvalidWorkflowError(
                        message=f"Unsupported component type: {node_type}",
                        details=f"Supported types: {', '.join(self.supported_components)}"
                    )
                
                config["nodes"][node_id] = {
                    "type": node_type,
                    "config": node_data,
                    "position": node.get("position", {})
                }
            
            # Build execution order from edges
            config["connections"] = self._build_execution_graph(edges)
            config["execution_order"] = self._determine_execution_order(nodes, edges)
            
            return config
            
        except Exception as e:
            if isinstance(e, InvalidWorkflowError):
                raise
            raise WorkflowParsingError(
                message="Failed to parse workflow definition",
                details=str(e)
            )
    
    def _build_execution_graph(self, edges: List[Dict]) -> Dict[str, List[str]]:
        """Build execution graph from React Flow edges"""
        connections = {}
        
        for edge in edges:
            source = edge.get("source")
            target = edge.get("target")
            
            if source and target:
                if source not in connections:
                    connections[source] = []
                connections[source].append(target)
        
        return connections
    
    def _determine_execution_order(self, nodes: List[Dict], edges: List[Dict]) -> List[str]:
        """Determine execution order using topological sort"""
        # For the basic RAG workflow: UserQuery -> KnowledgeBase -> LLMEngine -> Output
        # We'll implement a simple ordering based on component types
        
        type_priority = {
            "userQuery": 1,
            "knowledgeBase": 2,
            "webSearch": 2,  # Same priority as knowledge base (parallel)
            "llmEngine": 3,
            "output": 4
        }
        
        # Sort nodes by type priority
        sorted_nodes = sorted(nodes, key=lambda x: type_priority.get(x.get("type"), 999))
        
        return [node["id"] for node in sorted_nodes]
    
    async def _execute_rag_pipeline(
        self,
        user_query: str,
        workflow_config: Dict[str, Any],
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute the RAG pipeline based on workflow configuration"""
        try:
            nodes = workflow_config["nodes"]
            execution_order = workflow_config["execution_order"]
            
            # Initialize execution context
            context = {
                "user_query": user_query,
                "retrieved_context": [],
                "web_results": [],
                "final_response": "",
                "sources": [],
                "execution_log": []
            }
            
            # Execute nodes in order
            for node_id in execution_order:
                node = nodes[node_id]
                node_type = node["type"]
                node_config = node["config"]
                
                context["execution_log"].append(f"Executing {node_type} ({node_id})")
                
                if node_type == "userQuery":
                    # Already have user query
                    continue
                    
                elif node_type == "knowledgeBase":
                    context = await self._execute_knowledge_base_node(context, node_config)
                    
                elif node_type == "webSearch":
                    context = await self._execute_web_search_node(context, node_config)
                    
                elif node_type == "llmEngine":
                    context = await self._execute_llm_engine_node(context, node_config)
                    
                elif node_type == "output":
                    context = await self._execute_output_node(context, node_config)
            
            return {
                "response_text": context["final_response"],
                "retrieved_sources": context["sources"],
                "execution_log": context["execution_log"],
                "session_id": session_id
            }
            
        except Exception as e:
            raise RAGPipelineError(
                message="RAG pipeline execution failed",
                details=str(e)
            )
    
    async def _execute_knowledge_base_node(
        self, 
        context: Dict[str, Any], 
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute knowledge base retrieval"""
        try:
            # Get configuration
            n_results = config.get("n_results", 5)
            document_ids = config.get("document_ids")
            
            # Retrieve relevant context
            relevant_chunks = await knowledge_base_service.retrieve_relevant_context(
                query=context["user_query"],
                n_results=n_results,
                document_ids=document_ids
            )
            
            # Extract text and sources
            context["retrieved_context"] = [chunk["text"] for chunk in relevant_chunks]
            context["sources"].extend([
                {
                    "type": "knowledge_base",
                    "source": chunk["source"],
                    "similarity": chunk["similarity"]
                }
                for chunk in relevant_chunks
            ])
            
            context["execution_log"].append(f"Retrieved {len(relevant_chunks)} relevant chunks")
            
            return context
            
        except Exception as e:
            raise RAGPipelineError(
                message="Knowledge base node execution failed",
                details=str(e)
            )
    
    async def _execute_web_search_node(
        self,
        context: Dict[str, Any],
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute web search (placeholder - would integrate with SerpAPI)"""
        try:
            # This would integrate with SerpAPI or similar service
            # For now, we'll just add a placeholder
            
            search_enabled = config.get("enabled", False)
            
            if search_enabled:
                context["execution_log"].append("Web search node executed (placeholder)")
                # In a real implementation, this would call SerpAPI
                # web_results = await serpapi_service.search(context["user_query"])
                # context["web_results"] = web_results
            
            return context
            
        except Exception as e:
            raise RAGPipelineError(
                message="Web search node execution failed",
                details=str(e)
            )
    
    async def _execute_llm_engine_node(
        self,
        context: Dict[str, Any],
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute LLM generation"""
        try:
            # Get configuration
            model = config.get("model", "gpt-4o-mini")
            temperature = config.get("temperature", 0.7)
            use_web_search = config.get("use_web_search", False)
            
            # Prepare context for RAG
            all_context = context["retrieved_context"].copy()
            
            if use_web_search and context["web_results"]:
                all_context.extend(context["web_results"])
            
            # Execute RAG pipeline
            if all_context:
                result = await openai_service.run_rag_pipeline(
                    user_query=context["user_query"],
                    retrieved_context=all_context
                )
                context["final_response"] = result["response_text"]
                context["execution_log"].append("LLM generated response using RAG")
            else:
                # Fallback to direct LLM response
                messages = [
                    {
                        "role": "system",
                        "content": "You are a helpful AI assistant."
                    },
                    {
                        "role": "user",
                        "content": context["user_query"]
                    }
                ]
                result = await openai_service.generate_chat_completion(messages, model=model, temperature=temperature)
                context["final_response"] = result["content"]
                context["execution_log"].append("LLM generated direct response (no context)")
            
            return context
            
        except Exception as e:
            raise RAGPipelineError(
                message="LLM engine node execution failed",
                details=str(e)
            )
    
    async def _execute_output_node(
        self,
        context: Dict[str, Any],
        config: Dict[str, Any]
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
                message="Output node execution failed",
                details=str(e)
            )

# Singleton instance
workflow_executor = WorkflowExecutor()
