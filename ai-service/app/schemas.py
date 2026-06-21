from typing import Any, Optional

from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str
    content: str


class TutorProfile(BaseModel):
    """User context gathered by Next and passed in (Python stays stateless)."""

    userName: str = "Learner"
    ageGroup: str = "15+"
    accountAge: int = 0
    totalCourses: int = 0
    coursesCompleted: int = 0
    progressPercentage: int = 0
    totalMinutes: int = 0
    recentQuizScores: str = "No quizzes taken yet"
    avgQuizScore: int = 0
    currentStreak: int = 0
    lastActive: str = "Never"
    weakAreas: str = "None identified yet"
    strongAreas: str = "Keep learning to find your strengths!"
    language: str = "en"
    learningStyle: str = "Visual learner"


class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    conversation_history: list[ChatMessage] = []
    profile: Optional[TutorProfile] = None


class VoiceChatRequest(BaseModel):
    audio: str  # base64-encoded webm
    language: str = "en"
    conversation_history: list[ChatMessage] = []
    voice_enabled: bool = True
    profile: Optional[TutorProfile] = None


class TtsRequest(BaseModel):
    text: str
    voice: str = "nova"


class RecognizeRequest(BaseModel):
    frames: list[str]  # base64-encoded jpeg frames


class ReportInsightsRequest(BaseModel):
    student: dict[str, Any] = {}
    statistics: dict[str, Any] = {}
    weeklyActivity: list[int] = []
    quizTrend: list[dict[str, Any]] = []
    courseProgress: list[dict[str, Any]] = []


class ChatResponse(BaseModel):
    success: bool = True
    response: dict[str, Any]
    language: str


class VoiceChatResponse(BaseModel):
    success: bool = True
    transcription: str
    response: dict[str, Any]
    audio: Optional[str] = None
    language: str
