import os
from dotenv import load_dotenv

# # 确保.env文件在项目根目录
# load_dotenv(os.path.join(os.path.abspath(os.path.dirname(__file__)), '../.env'))


class Config:
    # 系统名称
    SYSTEM_NAME = "兰心慧诊：基于多模态知识的女性肿瘤辅助诊断系统"
    SYSTEM_VERSION = "1.0.0"
    
    # API配置
    API_KEY = "EMPTY"
    API_ENDPOINT = ""
    API_BASE_URL = "http://localhost:8080/v1"
    MODEL_NAME = "DeepSeek-R1-Medical"
    MAX_HISTORY = 6
    TEMPERATURE = 0.3
    MAX_TOKENS = 450
    
    # 文件夹配置
    STATIC_FOLDER = '../static'
    TEMPLATES_FOLDER = '../templates'
    
    # 女性肿瘤相关配置
    TUMOR_TYPES = ['宫颈癌', '卵巢癌', '子宫内膜癌', '乳腺癌']
    RISK_FACTORS = ['年龄', '家族史', 'HPV感染史', 'BRCA基因突变', '生育史']