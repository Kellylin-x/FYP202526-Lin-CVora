from openai import OpenAI
import os
from typing import Dict, Optional
import re


class AIService:
    """
    AI Service for CV enhancement using OpenAI API
    Implements STAR method and UK/Ireland CV best practices
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize AI service with OpenAI API key
        
        Args:
            api_key: OpenAI API key (if None, reads from OPENAI_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            print("WARNING: OPENAI_API_KEY not set. AI features will not work.")
            self.client = None
        else:
            self.client = OpenAI(api_key=self.api_key)
        
        # Model configuration
        self.model = "gpt-3.5-turbo"  # Use GPT-3.5 for cost efficiency
        self.temperature = 0.7  # Balance creativity and consistency
        self.max_tokens = 150  # Enough for 1-2 enhanced bullet points
    
    def enhance_bullet_point(self, text: str, context: Dict) -> Dict:
        """
        Enhance a CV bullet point using STAR method
        
        Args:
            text: Original bullet point text
            context: Dictionary with job_title, company, etc.
            
        Returns:
            Dictionary with original, enhanced, improvements, confidence
        """
        if not self.client:
            return {
                "original": text,
                "enhanced": text,
                "error": "AI service not configured (missing API key)",
                "improvements": {},
                "confidence": 0.0
            }
        
        # Pre-checks
        if len(text.strip()) < 5:
            return {
                "original": text,
                "enhanced": text,
                "error": "Text too short to enhance",
                "improvements": {},
                "confidence": 0.0
            }
        
        # Build enhancement prompt
        prompt = self._build_enhancement_prompt(text, context)
        
        try:
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": self._get_system_prompt()
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            enhanced_text = response.choices[0].message.content.strip()
            
            # Remove any quotes or markdown that OpenAI might add
            enhanced_text = self._clean_ai_output(enhanced_text)
            
            # Validate enhancement
            if not self._validate_enhancement(text, enhanced_text):
                return {
                    "original": text,
                    "enhanced": text,
                    "error": "AI produced invalid enhancement",
                    "improvements": {},
                    "confidence": 0.0
                }
            
            # Analyze improvements
            improvements = self._analyze_improvements(text, enhanced_text)
            
            # Calculate confidence score
            confidence = self._calculate_confidence(improvements)
            
            return {
                "original": text,
                "enhanced": enhanced_text,
                "improvements": improvements,
                "confidence": confidence,
                "error": None
            }
            
        except Exception as e:
            return {
                "original": text,
                "enhanced": text,
                "error": f"AI service error: {str(e)}",
                "improvements": {},
                "confidence": 0.0
            }
    
    def _get_system_prompt(self) -> str:
        """
        System prompt defining AI behavior
        """
        return """You are an expert CV writer specializing in UK and Ireland STEM roles.

Your task is to improve CV bullet points using these principles:
1. STAR Method: Situation, Task, Action, Result
2. Strong action verbs (developed, led, implemented, optimized, etc.)
3. Quantifiable results and metrics where possible
4. Concise and professional tone
5. UK/Ireland CV standards (not US resume style)

CRITICAL RULES:
- DO NOT fabricate information or add details not in the original
- DO NOT make the text longer than 2 lines (approximately 150 characters)
- DO NOT use overly promotional language
- DO respond with ONLY the improved bullet point, no explanations
- DO maintain the core meaning and facts of the original text"""
    
    def _build_enhancement_prompt(self, text: str, context: Dict) -> str:
        """
        Build specific enhancement prompt for this bullet point
        """
        job_title = context.get('job_title', 'a STEM role')
        company = context.get('company', 'a company')
        
        return f"""Improve this CV bullet point for {job_title} at {company}:

Original: {text}

Requirements:
- Start with a strong action verb if not already present
- Add measurable results ONLY if the original text suggests them
- Use STAR method (Situation, Task, Action, Result)
- Keep under 2 lines (max 150 characters)
- Maintain professional UK/Ireland CV tone
- DO NOT invent information not in the original

Return ONLY the improved bullet point, nothing else."""
    
    def _clean_ai_output(self, text: str) -> str:
        """
        Clean up AI output (remove quotes, markdown, etc.)
        """
        # Remove surrounding quotes
        text = text.strip('"\'')
        
        # Remove markdown
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)  # Remove bold
        text = re.sub(r'\*(.+?)\*', r'\1', text)      # Remove italic
        
        # Remove bullet points if AI added them
        text = re.sub(r'^[\-\*•]\s+', '', text)
        
        return text.strip()
    
    def _validate_enhancement(self, original: str, enhanced: str) -> bool:
        """
        Validate that enhancement is acceptable
        """
        # Check enhanced is not empty
        if not enhanced or len(enhanced.strip()) < 5:
            return False
        
        # Check it's not too long (max ~200 chars for 2 lines)
        if len(enhanced) > 200:
            return False
        
        # Check it's actually different from original
        if enhanced.lower().strip() == original.lower().strip():
            return False
        
        # Check it doesn't look like an error message
        error_indicators = ['error', 'cannot', 'unable', 'sorry', 'i cannot']
        if any(indicator in enhanced.lower() for indicator in error_indicators):
            return False
        
        return True
    
    def _analyze_improvements(self, original: str, enhanced: str) -> Dict:
        """
        Analyze what improvements were made
        """
        improvements = {
            "has_action_verb": False,
            "has_measurable_result": False,
            "length_appropriate": False,
            "improved_clarity": False
        }
        
        # Check for strong action verb at start
        action_verbs = [
            'developed', 'led', 'managed', 'designed', 'implemented', 'created',
            'achieved', 'improved', 'increased', 'reduced', 'built', 'delivered',
            'optimized', 'automated', 'analyzed', 'established', 'coordinated',
            'executed', 'engineered', 'architected', 'deployed', 'maintained',
            'enhanced', 'streamlined', 'collaborated', 'spearheaded'
        ]
        
        first_word = enhanced.split()[0].lower() if enhanced.split() else ''
        improvements["has_action_verb"] = first_word in action_verbs
        
        # Check for measurable results (numbers, percentages, metrics)
        number_pattern = r'\d+[\d,]*\.?\d*\s*(%|percent|users|hours|days|months|weeks|years|times|x)?'
        improvements["has_measurable_result"] = bool(re.search(number_pattern, enhanced))
        
        # Check length is appropriate (not too long)
        improvements["length_appropriate"] = 20 < len(enhanced) < 200
        
        # Check if enhanced is more specific than original
        # Simple heuristic: more words and more specific terms
        improvements["improved_clarity"] = (
            len(enhanced.split()) > len(original.split()) and
            len(enhanced) > len(original)
        )
        
        return improvements
    
    def _calculate_confidence(self, improvements: Dict) -> float:
        """
        Calculate confidence score based on improvements made
        """
        # Weight each improvement type
        weights = {
            "has_action_verb": 0.25,
            "has_measurable_result": 0.35,
            "length_appropriate": 0.20,
            "improved_clarity": 0.20
        }
        
        confidence = 0.0
        for key, weight in weights.items():
            if improvements.get(key, False):
                confidence += weight
        
        return round(confidence, 2)


# Singleton instance
ai_service = AIService()