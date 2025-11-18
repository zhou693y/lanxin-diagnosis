from LBIS.services.conversation import ConversationManager
from LBIS.services import MedicalQAEngine
from LBIS.config import Config

# 扩展实例化
conversation_manager = ConversationManager(max_history=Config.MAX_HISTORY)
medical_engine = MedicalQAEngine()