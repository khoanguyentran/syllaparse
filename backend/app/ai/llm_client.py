import logging
from typing import Dict, Any, List, Optional
from openai import OpenAI
from anthropic import Anthropic
from .config import ai_config

logger = logging.getLogger(__name__)

class LLMClient:
    """Simple LLM client for OpenAI and Anthropic"""
    
    def __init__(self):
        self.openai_client = None
        self.anthropic_client = None
        
        # Initialize OpenAI client if API key is available
        if ai_config.openai_api_key:
            self.openai_client = OpenAI(api_key=ai_config.openai_api_key)
        
        # Initialize Anthropic client if API key is available
        if ai_config.anthropic_api_key:
            self.anthropic_client = Anthropic(api_key=ai_config.anthropic_api_key)
    
    async def generate_response(self, prompt: str, model: str = "auto") -> str:
        """Generate response using available LLM"""
        try:
            if model == "auto":
                # Try OpenAI first, then Anthropic
                if self.openai_client:
                    return await self._call_openai(prompt)
                elif self.anthropic_client:
                    return await self._call_anthropic(prompt)
                else:
                    raise ValueError("No LLM API keys configured")
            elif model == "openai" and self.openai_client:
                return await self._call_openai(prompt)
            elif model == "anthropic" and self.anthropic_client:
                return await self._call_anthropic(prompt)
            else:
                raise ValueError(f"Model {model} not available")
                
        except Exception as e:
            logger.error(f"Error generating LLM response: {e}")
            raise
    
    async def _call_openai(self, prompt: str) -> str:
        """Call OpenAI API"""
        try:
            response = self.openai_client.chat.completions.create(
                model=ai_config.openai_model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=ai_config.openai_max_tokens,
                temperature=ai_config.openai_temperature
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise
    
    async def _call_anthropic(self, prompt: str) -> str:
        """Call Anthropic API"""
        try:
            response = self.anthropic_client.messages.create(
                model=ai_config.anthropic_model,
                max_tokens=ai_config.anthropic_max_tokens,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            raise
    
    def is_available(self) -> bool:
        """Check if any LLM service is available"""
        return bool(self.openai_client or self.anthropic_client)
