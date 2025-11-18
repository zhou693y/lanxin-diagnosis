// 全局变量
let sessionId = null;
let conversations = [];

// 页面加载完成后初始化
window.onload = async function() {
    await createSession();

    document.getElementById('send-button').addEventListener('click', sendMessage);
    document.getElementById('user-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    document.getElementById('new-conversation').addEventListener('click', createNewConversation);
};

// 创建新会话
async function createSession() {
    try {
        const response = await fetch('/api/v1/create_session', {  // 修改路径
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        sessionId = data.session_id;
    } catch (error) {
        console.error('创建会话失败:', error);
        appendMessage('系统错误：无法创建新会话', 'assistant');
    }
}

// 创建新的会话记录
function createNewConversation() {
    const conversation = {
        id: Date.now(),
        title: `问诊会话 ${conversations.length + 1}`,
        timestamp: new Date().toISOString()
    };

    conversations.push(conversation);
    updateConversationsList();
    createSession();
    clearMessages();
}

// 更新会话列表
function updateConversationsList() {
    const listContainer = document.querySelector('.conversations-list');
    listContainer.innerHTML = '';

    conversations.forEach(conv => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'list-group-item list-group-item-action conversation-item animate__animated animate__fadeInLeft';
        item.innerHTML = `
            <i class="bi bi-chat-left-text me-2"></i>
            ${conv.title}
        `;

        item.addEventListener('click', () => switchConversation(conv));
        listContainer.appendChild(item);
    });
}

// 切换会话
function switchConversation(conversation) {
    clearMessages();
    createSession();
}

// 清空消息
function clearMessages() {
    document.getElementById('chat-container').innerHTML = '';
}

// 添加消息到界面
function appendMessage(message, role) {
    const chatContainer = document.getElementById('chat-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message p-3 rounded ${role === 'user' ? 'user-message' : 'assistant-message'}`;
    messageDiv.textContent = message;

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 发送消息
async function sendMessage() {
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();

    if (!message) return;

    appendMessage(message, 'user');
    userInput.value = '';

    try {
        const response = await fetch('/api/v1/query', {  // 修改路径
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: message,
                session_id: sessionId,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            appendMessage(data.error, 'assistant');
        } else {
            appendMessage(data.answer, 'assistant');

            if (data.recommended_exams?.length > 0) {
                appendMessage("建议检查：" + data.recommended_exams.join(", "), 'assistant');
            }

            appendMessage("紧急程度：" + data.urgency + "（1为最高）", 'assistant');
        }
    } catch (error) {
        console.error('发送消息时出错:', error);
        appendMessage('发送消息失败，请稍后重试', 'assistant');
    }
}
// 知识库查询组件 - 添加到main.js文件中

// 知识库查询相关函数
async function initKnowledgeBase() {
    const searchInput = document.getElementById('knowledge-search');
    const searchButton = document.getElementById('knowledge-search-btn');

    if (searchInput && searchButton) {
        searchButton.addEventListener('click', () => searchKnowledge(searchInput.value));
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchKnowledge(searchInput.value);
            }
        });
    }

    // 加载常见疾病列表
    await loadCommonDiseases();
}
// 搜索知识库
async function searchKnowledge(query) {
    if (!query.trim()) return;

    const resultsContainer = document.getElementById('knowledge-results');
    resultsContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p>正在查询...</p></div>';

    try {
        const response = await fetch('/api/v1/knowledge/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: query })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        displayKnowledgeResults(data.results);
    } catch (error) {
        console.error('知识库查询出错:', error);
        resultsContainer.innerHTML = '<div class="alert alert-danger">查询失败，请稍后重试</div>';
    }
}

// 显示知识库结果
function displayKnowledgeResults(results) {
    const resultsContainer = document.getElementById('knowledge-results');
    resultsContainer.innerHTML = '';

    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<div class="alert alert-info">未找到相关信息</div>';
        return;
    }

    results.forEach(result => {
        const resultCard = document.createElement('div');
        resultCard.className = 'card mb-3 animate__animated animate__fadeIn';

        resultCard.innerHTML = `
            <div class="card-header bg-primary text-white">
                <h5 class="card-title mb-0">${result.name}</h5>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <h6>描述</h6>
                    <p>${result.description || '无描述'}</p>
                </div>
                ${result.symptoms ? `
                <div class="mb-3">
                    <h6>症状</h6>
                    <p>${result.symptoms.join('、')}</p>
                </div>` : ''}
                ${result.treatment ? `
                <div class="mb-3">
                    <h6>治疗方法</h6>
                    <p>${result.treatment}</p>
                </div>` : ''}
                ${result.prevention ? `
                <div class="mb-3">
                    <h6>预防建议</h6>
                    <p>${result.prevention}</p>
                </div>` : ''}
            </div>
            <div class="card-footer text-end">
                <button class="btn btn-sm btn-outline-primary view-details-btn" data-id="${result.id}">
                    查看详情
                </button>
            </div>
        `;

        resultsContainer.appendChild(resultCard);
    });

    // 添加详情按钮事件
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            viewDiseaseDetails(id);
        });
    });
}

// 查看疾病详情
async function viewDiseaseDetails(id) {
    try {
        const response = await fetch(`/api/v1/knowledge/disease/${id}`);
        if (!response.ok) throw new Error('获取详情失败');

        const data = await response.json();

        // 创建模态框显示详情
        const modal = createDetailsModal(data);
        document.body.appendChild(modal);

        // 显示模态框
        new bootstrap.Modal(modal).show();

        // 模态框关闭时移除DOM
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    } catch (error) {
        console.error('获取疾病详情失败:', error);
        alert('获取详情失败，请稍后重试');
    }
}

// 创建疾病详情模态框
function createDetailsModal(disease) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = `disease-details-${disease.id}`;
    modal.tabIndex = '-1';

    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title">${disease.name}</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="container-fluid">
                        <div class="row mb-3">
                            <div class="col-12">
                                <h6>描述</h6>
                                <p>${disease.description || '无描述'}</p>
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h6>症状</h6>
                                <ul>
                                    ${disease.symptoms ? disease.symptoms.map(s => `<li>${s}</li>`).join('') : '<li>无数据</li>'}
                                </ul>
                            </div>
                            <div class="col-md-6">
                                <h6>常见检查</h6>
                                <ul>
                                    ${disease.examinations ? disease.examinations.map(e => `<li>${e}</li>`).join('') : '<li>无数据</li>'}
                                </ul>
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h6>治疗方法</h6>
                                <p>${disease.treatment || '无数据'}</p>
                            </div>
                            <div class="col-md-6">
                                <h6>预防建议</h6>
                                <p>${disease.prevention || '无数据'}</p>
                            </div>
                        </div>
                        
                        ${disease.medications ? `
                        <div class="row mb-3">
                            <div class="col-12">
                                <h6>推荐药物</h6>
                                <ul>
                                    ${disease.medications.map(m => `<li>${m}</li>`).join('')}
                                </ul>
                            </div>
                        </div>` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" data-bs-dismiss="modal">关闭</button>
                </div>
            </div>
        </div>
    `;

    return modal;
}

// 加载常见疾病列表
async function loadCommonDiseases() {
    const commonDiseasesContainer = document.getElementById('common-diseases');
    if (!commonDiseasesContainer) return;

    try {
        const response = await fetch('/api/v1/knowledge/common');
        if (!response.ok) throw new Error('获取常见疾病失败');

        const data = await response.json();

        commonDiseasesContainer.innerHTML = '';
        data.diseases.forEach(disease => {
            const diseaseBtn = document.createElement('button');
            diseaseBtn.className = 'btn btn-outline-secondary m-1';
            diseaseBtn.textContent = disease.name;
            diseaseBtn.addEventListener('click', () => {
                document.getElementById('knowledge-search').value = disease.name;
                searchKnowledge(disease.name);
            });

            commonDiseasesContainer.appendChild(diseaseBtn);
        });
    } catch (error) {
        console.error('加载常见疾病失败:', error);
        commonDiseasesContainer.innerHTML = '<div class="alert alert-warning">加载常见疾病失败</div>';
    }
}

// 将初始化函数添加到window.onload
const originalOnload = window.onload;
window.onload = async function() {
    if (originalOnload) await originalOnload();
    await initKnowledgeBase();
    initMedicalRecords();
    initReports();
    initTreatmentRecommendation();
};
// 初始化治疗推荐功能
function initTreatmentRecommendation() {
    const generateTreatmentBtn = document.getElementById('generate-treatment-btn');
    if (generateTreatmentBtn) {
        generateTreatmentBtn.addEventListener('click', generateTreatmentPlan);
    }
}

// 生成治疗方案
async function generateTreatmentPlan() {
    const diagnosisInput = document.getElementById('diagnosis-input').value.trim();
    const symptomsInput = document.getElementById('symptoms-input').value.trim();
    const patientDetails = document.getElementById('patient-details').value.trim();
    const resultContainer = document.getElementById('treatment-result');

    if (!diagnosisInput || !symptomsInput) {
        resultContainer.innerHTML = '<div class="alert alert-warning">请填写诊断结果和主要症状</div>';
        return;
    }

    // 显示加载状态
    resultContainer.innerHTML = `
        <div class="text-center p-4">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2">正在生成治疗方案，请稍候...</p>
        </div>
    `;

    try {
        const response = await fetch('/api/v1/treatment/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                diagnosis: diagnosisInput,
                symptoms: symptomsInput,
                patient_details: patientDetails,
                session_id: sessionId
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            resultContainer.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
            return;
        }

        // 展示治疗方案
        displayTreatmentPlan(data);
    } catch (error) {
        console.error('生成治疗方案时出错:', error);
        resultContainer.innerHTML = '<div class="alert alert-danger">生成治疗方案失败，请稍后重试</div>';
    }
}

// 展示治疗方案
function displayTreatmentPlan(data) {
    const resultContainer = document.getElementById('treatment-result');

    // 将治疗计划格式化为HTML（使用正则表达式处理常见的Markdown格式）
    const treatmentHtml = data.treatment_plan
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n([^:])/g, '<br>$1')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^### (.*?)$/gm, '<h5>$1</h5>')
        .replace(/^## (.*?)$/gm, '<h4>$1</h4>')
        .replace(/^# (.*?)$/gm, '<h3>$1</h3>');

    // 创建漂亮的治疗方案卡片
    resultContainer.innerHTML = `
        <div class="card animate__animated animate__fadeIn">
            <div class="card-header bg-primary text-white">
                <h5 class="card-title mb-0">个性化治疗方案</h5>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <h6>诊断：</h6>
                    <p>${data.diagnosis}</p>
                </div>
                
                <div class="mb-3">
                    <h6>治疗方案：</h6>
                    <div class="treatment-content">
                        <p>${treatmentHtml}</p>
                    </div>
                </div>
                
                ${data.recommended_exams && data.recommended_exams.length > 0 ? `
                <div class="mb-3">
                    <h6>建议检查：</h6>
                    <ul>
                        ${data.recommended_exams.map(exam => `<li>${exam}</li>`).join('')}
                    </ul>
                </div>` : ''}
                
                <div class="mb-3">
                    <h6>紧急程度：</h6>
                    <div class="progress">
                        <div class="progress-bar ${data.urgency === 1 ? 'bg-danger' : data.urgency === 2 ? 'bg-warning' : 'bg-success'}" 
                             role="progressbar" 
                             style="width: ${(4 - data.urgency) * 33}%" 
                             aria-valuenow="${4 - data.urgency}" 
                             aria-valuemin="0" 
                             aria-valuemax="3">
                            ${data.urgency === 1 ? '紧急' : data.urgency === 2 ? '中等' : '一般'}
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-footer text-end">
                <button class="btn btn-outline-primary me-2" id="save-treatment-btn">
                    <i class="bi bi-file-earmark-text me-2"></i>保存到病历
                </button>
                <button class="btn btn-primary" id="print-treatment-btn">
                    <i class="bi bi-printer me-2"></i>打印方案
                </button>
            </div>
        </div>
    `;

    // 绑定按钮事件
    document.getElementById('save-treatment-btn').addEventListener('click', () => saveTreatmentToRecord(data));
    document.getElementById('print-treatment-btn').addEventListener('click', () => printTreatmentPlan(data));
}

// 保存治疗方案到病历
function saveTreatmentToRecord(data) {
    // 如果没有选择患者，提示选择或创建患者
    if (!currentPatient) {
        // 显示选择患者对话框或直接跳转到病历页面
        document.querySelector('a[href="#records"]').click();
        alert('请先选择或创建一个患者记录');
        return;
    }

    // 如果已选择患者，则添加一条新的就诊记录
    const visitData = {
        id: Date.now(),
        patientId: currentPatient.id,
        date: new Date().toISOString().split('T')[0],
        chiefComplaint: data.symptoms || '系统生成的治疗方案',
        diagnosis: data.diagnosis,
        treatment: data.treatment_plan,
        nextAppointment: ''
    };

    // 模拟保存并跳转到病历页面
    alert('治疗方案已保存到患者病历');
    document.querySelector('a[href="#records"]').click();
    viewPatientDetails(currentPatient.id);
}

// 打印治疗方案
function printTreatmentPlan(data) {
    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>治疗方案 - ${data.diagnosis}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    margin: 20px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .section {
                    margin-bottom: 20px;
                }
                .section h3 {
                    border-bottom: 1px solid #ccc;
                    padding-bottom: 5px;
                }
                .footer {
                    margin-top: 30px;
                    text-align: right;
                }
                @media print {
                    body {
                        margin: 0;
                        padding: 15px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>个性化治疗方案</h2>
                <p>生成日期: ${new Date().toISOString().split('T')[0]}</p>
            </div>
            
            <div class="section">
                <h3>诊断</h3>
                <p>${data.diagnosis}</p>
            </div>
            
            <div class="section">
                <h3>治疗方案</h3>
                <div>
                    ${data.treatment_plan.replace(/\n/g, '<br>')}
                </div>
            </div>
            
            ${data.recommended_exams && data.recommended_exams.length > 0 ? `
            <div class="section">
                <h3>建议检查</h3>
                <ul>
                    ${data.recommended_exams.map(exam => `<li>${exam}</li>`).join('')}
                </ul>
            </div>` : ''}
            
            <div class="section">
                <h3>注意事项</h3>
                <p>本治疗方案仅供参考，实际用药请遵医嘱。如有不适，请立即就医。</p>
            </div>
            
            <div class="footer">
                <p>医师签名: ________________</p>
                <p>日期: ${new Date().toISOString().split('T')[0]}</p>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);

    printWindow.document.close();
}

// 患者记录数据
let patients = [];
let currentPatient = null;

// 初始化电子病历功能
function initMedicalRecords() {
    // 绑定按钮事件
    const newPatientBtn = document.getElementById('new-patient-btn');
    if (newPatientBtn) {
        newPatientBtn.addEventListener('click', showNewPatientForm);
    }

    // 加载患者列表
    loadPatients();

    // 初始化病历详情页面的保存按钮
    const saveRecordBtn = document.getElementById('save-record-btn');
    if (saveRecordBtn) {
        saveRecordBtn.addEventListener('click', savePatientRecord);
    }

    // 搜索功能
    const searchPatientInput = document.getElementById('search-patient');
    if (searchPatientInput) {
        searchPatientInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            filterPatients(query);
        });
    }
}

// 加载患者列表
async function loadPatients() {
    const patientsList = document.getElementById('patients-list');
    if (!patientsList) return;

    patientsList.innerHTML = '<div class="spinner-border text-primary" role="status"></div>';

    try {
        // 在实际应用中替换为API调用
        // const response = await fetch('/api/v1/patients');
        // patients = await response.json();

        // 模拟数据
        patients = [
            { id: 1, name: '张三', age: 45, gender: '男', phone: '13800138000', lastVisit: '2025-03-15' },
            { id: 2, name: '李四', age: 32, gender: '女', phone: '13900139000', lastVisit: '2025-03-12' },
            { id: 3, name: '王五', age: 58, gender: '男', phone: '13700137000', lastVisit: '2025-03-10' },
        ];

        renderPatientsList(patients);
    } catch (error) {
        console.error('加载患者列表失败:', error);
        patientsList.innerHTML = '<div class="alert alert-danger">加载患者列表失败</div>';
    }
}

// 渲染患者列表
function renderPatientsList(patientsList) {
    const patientsListElement = document.getElementById('patients-list');
    patientsListElement.innerHTML = '';

    if (patientsList.length === 0) {
        patientsListElement.innerHTML = '<div class="alert alert-info">暂无患者记录</div>';
        return;
    }

    patientsList.forEach(patient => {
        const patientCard = document.createElement('div');
        patientCard.className = 'card mb-2 animate__animated animate__fadeIn';

        patientCard.innerHTML = `
            <div class="card-body p-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0">${patient.name}</h6>
                        <small class="text-muted">${patient.gender}, ${patient.age}岁</small>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary view-patient-btn" data-id="${patient.id}">
                            查看
                        </button>
                    </div>
                </div>
            </div>
        `;

        patientsListElement.appendChild(patientCard);
    });

    // 添加查看患者信息事件
    document.querySelectorAll('.view-patient-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const patientId = parseInt(e.target.getAttribute('data-id'));
            viewPatientDetails(patientId);
        });
    });
}

// 过滤患者列表
function filterPatients(query) {
    if (!query) {
        renderPatientsList(patients);
        return;
    }

    const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(query) ||
        patient.phone.includes(query)
    );

    renderPatientsList(filteredPatients);
}

// 显示新建患者表单
function showNewPatientForm() {
    const recordsContainer = document.getElementById('records-container');
    if (!recordsContainer) return;

    recordsContainer.innerHTML = `
        <div class="card animate__animated animate__fadeIn">
            <div class="card-header bg-primary text-white">
                <h5 class="card-title mb-0">新建患者档案</h5>
            </div>
            <div class="card-body">
                <form id="new-patient-form">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="patient-name" class="form-label">姓名</label>
                            <input type="text" class="form-control" id="patient-name" required>
                        </div>
                        <div class="col-md-6">
                            <label for="patient-gender" class="form-label">性别</label>
                            <select class="form-select" id="patient-gender" required>
                                <option value="">请选择</option>
                                <option value="男">男</option>
                                <option value="女">女</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="patient-age" class="form-label">年龄</label>
                            <input type="number" class="form-control" id="patient-age" required min="0" max="120">
                        </div>
                        <div class="col-md-6">
                            <label for="patient-phone" class="form-label">手机号</label>
                            <input type="tel" class="form-control" id="patient-phone" required>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="patient-address" class="form-label">地址</label>
                        <input type="text" class="form-control" id="patient-address">
                    </div>
                    
                    <div class="mb-3">
                        <label for="patient-medical-history" class="form-label">既往病史</label>
                        <textarea class="form-control" id="patient-medical-history" rows="3"></textarea>
                    </div>
                    
                    <div class="mb-3">
                        <label for="patient-allergies" class="form-label">过敏史</label>
                        <textarea class="form-control" id="patient-allergies" rows="2"></textarea>
                    </div>
                    
                    <div class="text-end">
                        <button type="button" class="btn btn-secondary me-2" id="cancel-patient-btn">取消</button>
                        <button type="button" class="btn btn-primary" id="create-patient-btn">创建</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // 绑定取消和创建按钮事件
    document.getElementById('cancel-patient-btn').addEventListener('click', () => {
        recordsContainer.innerHTML = '';
    });

    document.getElementById('create-patient-btn').addEventListener('click', createNewPatient);
}

// 创建新患者
async function createNewPatient() {
    const form = document.getElementById('new-patient-form');

    // 简单验证
    const name = document.getElementById('patient-name').value;
    const gender = document.getElementById('patient-gender').value;
    const age = document.getElementById('patient-age').value;
    const phone = document.getElementById('patient-phone').value;

    if (!name || !gender || !age || !phone) {
        alert('请填写必要信息');
        return;
    }

    const newPatient = {
        id: patients.length + 1, // 在实际应用中，ID应由服务器生成
        name,
        gender,
        age: parseInt(age),
        phone,
        address: document.getElementById('patient-address').value,
        medicalHistory: document.getElementById('patient-medical-history').value,
        allergies: document.getElementById('patient-allergies').value,
        lastVisit: new Date().toISOString().split('T')[0]
    };

    try {
        // 在实际应用中替换为API调用
        // const response = await fetch('/api/v1/patients', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(newPatient)
        // });
        // const result = await response.json();

        // 模拟成功响应
        patients.push(newPatient);
        renderPatientsList(patients);

        // 清空表单
        document.getElementById('records-container').innerHTML = '';

        // 显示成功消息
        alert('患者创建成功');
    } catch (error) {
        console.error('创建患者失败:', error);
        alert('创建患者失败，请稍后重试');
    }
}

// 查看患者详情
async function viewPatientDetails(patientId) {
    const recordsContainer = document.getElementById('records-container');
    if (!recordsContainer) return;

    // 查找患者
    currentPatient = patients.find(p => p.id === patientId);
    if (!currentPatient) {
        alert('未找到患者信息');
        return;
    }

    // 模拟加载患者病历记录
    const visits = [
        {
            id: 1,
            date: '2025-03-15',
            chiefComplaint: '腹部疼痛',
            diagnosis: '急性胃炎',
            treatment: '质子泵抑制剂, 抗生素',
            nextAppointment: '2025-03-15'
        },
        {
            id: 2,
            date: '2025-03-15',
            chiefComplaint: '头痛，发热',
            diagnosis: '上呼吸道感染',
            treatment: '布洛芬, 头孢菌素',
            nextAppointment: '2025-03-15'
        }
    ];

    recordsContainer.innerHTML = `
        <div class="card animate__animated animate__fadeIn">
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">患者档案 - ${currentPatient.name}</h5>
                <button class="btn btn-light btn-sm" id="edit-patient-btn">编辑</button>
            </div>
            <div class="card-body">
                <div class="row mb-4">
                    <div class="col-md-6">
                        <h6>基本信息</h6>
                        <table class="table table-bordered">
                            <tr>
                                <th width="30%">姓名</th>
                                <td>${currentPatient.name}</td>
                            </tr>
                            <tr>
                                <th>性别</th>
                                <td>${currentPatient.gender}</td>
                            </tr>
                            <tr>
                                <th>年龄</th>
                                <td>${currentPatient.age}岁</td>
                            </tr>
                            <tr>
                                <th>联系电话</th>
                                <td>${currentPatient.phone}</td>
                            </tr>
                            <tr>
                                <th>地址</th>
                                <td>${currentPatient.address || '未填写'}</td>
                            </tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h6>医疗信息</h6>
                        <table class="table table-bordered">
                            <tr>
                                <th width="30%">既往病史</th>
                                <td>${currentPatient.medicalHistory || '无'}</td>
                            </tr>
                            <tr>
                                <th>过敏史</th>
                                <td>${currentPatient.allergies || '无'}</td>
                            </tr>
                            <tr>
                                <th>最近就诊</th>
                                <td>${currentPatient.lastVisit}</td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6>就诊记录</h6>
                    <button class="btn btn-primary btn-sm" id="new-visit-btn">新增就诊</button>
                </div>
                
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>日期</th>
                                <th>主诉</th>
                                <th>诊断</th>
                                <th>治疗</th>
                                <th>下次复诊</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="visits-list">
                            ${visits.map(visit => `
                                <tr>
                                    <td>${visit.date}</td>
                                    <td>${visit.chiefComplaint}</td>
                                    <td>${visit.diagnosis}</td>
                                    <td>${visit.treatment}</td>
                                    <td>${visit.nextAppointment}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary view-visit-btn" data-id="${visit.id}">
                                            查看
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // 绑定事件
    document.getElementById('edit-patient-btn').addEventListener('click', () => editPatient(currentPatient));
    document.getElementById('new-visit-btn').addEventListener('click', addNewVisit);

    document.querySelectorAll('.view-visit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const visitId = parseInt(e.target.getAttribute('data-id'));
            viewVisitDetails(visits.find(v => v.id === visitId));
        });
    });
}

// 编辑患者信息
function editPatient(patient) {
    const recordsContainer = document.getElementById('records-container');
    if (!recordsContainer) return;

    recordsContainer.innerHTML = `
        <div class="card animate__animated animate__fadeIn">
            <div class="card-header bg-primary text-white">
                <h5 class="card-title mb-0">编辑患者信息</h5>
            </div>
            <div class="card-body">
                <form id="edit-patient-form">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="patient-name-edit" class="form-label">姓名</label>
                            <input type="text" class="form-control" id="patient-name-edit" value="${patient.name}" required>
                        </div>
                        <div class="col-md-6">
                            <label for="patient-gender-edit" class="form-label">性别</label>
                            <select class="form-select" id="patient-gender-edit" required>
                                <option value="男" ${patient.gender === '男' ? 'selected' : ''}>男</option>
                                <option value="女" ${patient.gender === '女' ? 'selected' : ''}>女</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="patient-age-edit" class="form-label">年龄</label>
                            <input type="number" class="form-control" id="patient-age-edit" value="${patient.age}" required min="0" max="120">
                        </div>
                        <div class="col-md-6">
                            <label for="patient-phone-edit" class="form-label">手机号</label>
                            <input type="tel" class="form-control" id="patient-phone-edit" value="${patient.phone}" required>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="patient-address-edit" class="form-label">地址</label>
                        <input type="text" class="form-control" id="patient-address-edit" value="${patient.address || ''}">
                    </div>
                    
                    <div class="mb-3">
                        <label for="patient-medical-history-edit" class="form-label">既往病史</label>
                        <textarea class="form-control" id="patient-medical-history-edit" rows="3">${patient.medicalHistory || ''}</textarea>
                    </div>
                    
                    <div class="mb-3">
                        <label for="patient-allergies-edit" class="form-label">过敏史</label>
                        <textarea class="form-control" id="patient-allergies-edit" rows="2">${patient.allergies || ''}</textarea>
                    </div>
                    
                    <div class="text-end">
                        <button type="button" class="btn btn-secondary me-2" id="cancel-edit-btn">取消</button>
                        <button type="button" class="btn btn-primary" id="update-patient-btn">保存</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // 绑定事件
    document.getElementById('cancel-edit-btn').addEventListener('click', () => viewPatientDetails(patient.id));
    document.getElementById('update-patient-btn').addEventListener('click', () => updatePatient(patient.id));
}

// 更新患者信息
async function updatePatient(patientId) {
    // 简单验证
    const name = document.getElementById('patient-name-edit').value;
    const gender = document.getElementById('patient-gender-edit').value;
    const age = document.getElementById('patient-age-edit').value;
    const phone = document.getElementById('patient-phone-edit').value;

    if (!name || !gender || !age || !phone) {
        alert('请填写必要信息');
        return;
    }

    const updatedPatient = {
        ...currentPatient,
        name,
        gender,
        age: parseInt(age),
        phone,
        address: document.getElementById('patient-address-edit').value,
        medicalHistory: document.getElementById('patient-medical-history-edit').value,
        allergies: document.getElementById('patient-allergies-edit').value
    };

    try {
        // 在实际应用中替换为API调用
        // const response = await fetch(`/api/v1/patients/${patientId}`, {
        //     method: 'PUT',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(updatedPatient)
        // });
        // const result = await response.json();

        // 模拟成功响应
        const index = patients.findIndex(p => p.id === patientId);
        if (index !== -1) {
            patients[index] = updatedPatient;
            currentPatient = updatedPatient;
        }

        renderPatientsList(patients);
        viewPatientDetails(patientId);

        // 显示成功消息
        alert('患者信息更新成功');
    } catch (error) {
        console.error('更新患者信息失败:', error);
        alert('更新患者信息失败，请稍后重试');
    }
}

// 继续电子病历管理组件代码

// 添加新就诊记录
function addNewVisit() {
    if (!currentPatient) return;

    const recordsContainer = document.getElementById('records-container');

    recordsContainer.innerHTML = `
        <div class="card animate__animated animate__fadeIn">
            <div class="card-header bg-primary text-white">
                <h5 class="card-title mb-0">新增就诊记录 - ${currentPatient.name}</h5>
            </div>
            <div class="card-body">
                <form id="new-visit-form">
                    <div class="mb-3">
                        <label for="visit-date" class="form-label">就诊日期</label>
                        <input type="date" class="form-control" id="visit-date" value="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    
                    <div class="mb-3">
                        <label for="chief-complaint" class="form-label">主诉</label>
                        <textarea class="form-control" id="chief-complaint" rows="2" required></textarea>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="vital-signs" class="form-label">生命体征</label>
                            <textarea class="form-control" id="vital-signs" rows="3" placeholder="体温、血压、心率等"></textarea>
                        </div>
                        <div class="col-md-6">
                            <label for="physical-exam" class="form-label">体格检查</label>
                            <textarea class="form-control" id="physical-exam" rows="3"></textarea>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="diagnosis" class="form-label">诊断</label>
                        <input type="text" class="form-control" id="diagnosis" required>
                    </div>
                    
                    <div class="mb-3">
                        <label for="treatment" class="form-label">治疗方案</label>
                        <textarea class="form-control" id="treatment" rows="3" required></textarea>
                    </div>
                    
                    <div class="mb-3">
                        <label for="prescription" class="form-label">处方</label>
                        <textarea class="form-control" id="prescription" rows="3"></textarea>
                    </div>
                    
                    <div class="mb-3">
                        <label for="next-appointment" class="form-label">下次复诊日期</label>
                        <input type="date" class="form-control" id="next-appointment">
                    </div>
                    
                    <div class="mb-3">
                        <label for="notes" class="form-label">备注</label>
                        <textarea class="form-control" id="notes" rows="2"></textarea>
                    </div>
                    
                    <div class="text-end">
                        <button type="button" class="btn btn-secondary me-2" id="cancel-visit-btn">取消</button>
                        <button type="button" class="btn btn-primary" id="save-visit-btn">保存</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // 绑定事件
    document.getElementById('cancel-visit-btn').addEventListener('click', () => viewPatientDetails(currentPatient.id));
    document.getElementById('save-visit-btn').addEventListener('click', saveVisit);
}

// 保存就诊记录
async function saveVisit() {
    // 简单验证
    const chiefComplaint = document.getElementById('chief-complaint').value;
    const diagnosis = document.getElementById('diagnosis').value;
    const treatment = document.getElementById('treatment').value;

    if (!chiefComplaint || !diagnosis || !treatment) {
        alert('请填写必要信息');
        return;
    }

    const newVisit = {
        id: Date.now(), // 在实际应用中，ID应由服务器生成
        patientId: currentPatient.id,
        date: document.getElementById('visit-date').value,
        chiefComplaint,
        vitalSigns: document.getElementById('vital-signs').value,
        physicalExam: document.getElementById('physical-exam').value,
        diagnosis,
        treatment,
        prescription: document.getElementById('prescription').value,
        nextAppointment: document.getElementById('next-appointment').value,
        notes: document.getElementById('notes').value
    };

    try {
        // 在实际应用中替换为API调用
        // const response = await fetch('/api/v1/visits', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(newVisit)
        // });
        // const result = await response.json();

        // 更新患者最后就诊日期
        currentPatient.lastVisit = newVisit.date;

        // 重新加载患者详情
        viewPatientDetails(currentPatient.id);

        // 显示成功消息
        alert('就诊记录保存成功');
    } catch (error) {
        console.error('保存就诊记录失败:', error);
        alert('保存就诊记录失败，请稍后重试');
    }
}

// 查看就诊详情
function viewVisitDetails(visit) {
    if (!visit) return;

    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = `visit-details-${visit.id}`;
    modal.tabIndex = '-1';

    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title">就诊详情 - ${visit.date}</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <table class="table table-bordered">
                        <tr>
                            <th width="20%">就诊日期</th>
                            <td>${visit.date}</td>
                        </tr>
                        <tr>
                            <th>主诉</th>
                            <td>${visit.chiefComplaint}</td>
                        </tr>
                        <tr>
                            <th>诊断</th>
                            <td>${visit.diagnosis}</td>
                        </tr>
                        <tr>
                            <th>治疗方案</th>
                            <td>${visit.treatment}</td>
                        </tr>
                        <tr>
                            <th>下次复诊</th>
                            <td>${visit.nextAppointment || '未设置'}</td>
                        </tr>
                    </table>
                    
                    <div class="mt-3">
                        <button class="btn btn-outline-primary" id="generate-report-btn" data-visit-id="${visit.id}">
                            <i class="bi bi-file-earmark-text me-2"></i>生成报告
                        </button>
                        <button class="btn btn-outline-secondary" id="edit-visit-btn" data-visit-id="${visit.id}">
                            <i class="bi bi-pencil me-2"></i>编辑记录
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 显示模态框
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    // 模态框关闭时移除DOM
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });

    // 绑定事件
    document.getElementById('generate-report-btn').addEventListener('click', () => {
        modalInstance.hide();
        generateMedicalReport(visit);
    });

    document.getElementById('edit-visit-btn').addEventListener('click', () => {
        modalInstance.hide();
        editVisit(visit);
    });
}

// 编辑就诊记录
function editVisit(visit) {
    if (!visit) return;

    const recordsContainer = document.getElementById('records-container');

    recordsContainer.innerHTML = `
        <div class="card animate__animated animate__fadeIn">
            <div class="card-header bg-primary text-white">
                <h5 class="card-title mb-0">编辑就诊记录 - ${currentPatient.name}</h5>
            </div>
            <div class="card-body">
                <form id="edit-visit-form">
                    <div class="mb-3">
                        <label for="visit-date-edit" class="form-label">就诊日期</label>
                        <input type="date" class="form-control" id="visit-date-edit" value="${visit.date}" required>
                    </div>
                    
                    <div class="mb-3">
                        <label for="chief-complaint-edit" class="form-label">主诉</label>
                        <textarea class="form-control" id="chief-complaint-edit" rows="2" required>${visit.chiefComplaint}</textarea>
                    </div>
                    
                    <div class="mb-3">
                        <label for="diagnosis-edit" class="form-label">诊断</label>
                        <input type="text" class="form-control" id="diagnosis-edit" value="${visit.diagnosis}" required>
                    </div>
                    
                    <div class="mb-3">
                        <label for="treatment-edit" class="form-label">治疗方案</label>
                        <textarea class="form-control" id="treatment-edit" rows="3" required>${visit.treatment}</textarea>
                    </div>
                    
                    <div class="mb-3">
                        <label for="next-appointment-edit" class="form-label">下次复诊日期</label>
                        <input type="date" class="form-control" id="next-appointment-edit" value="${visit.nextAppointment || ''}">
                    </div>
                    
                    <div class="text-end">
                        <button type="button" class="btn btn-secondary me-2" id="cancel-edit-visit-btn">取消</button>
                        <button type="button" class="btn btn-primary" id="update-visit-btn" data-visit-id="${visit.id}">保存</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // 绑定事件
    document.getElementById('cancel-edit-visit-btn').addEventListener('click', () => viewPatientDetails(currentPatient.id));
    document.getElementById('update-visit-btn').addEventListener('click', (e) => {
        const visitId = parseInt(e.target.getAttribute('data-visit-id'));
        updateVisit(visitId);
    });
}

// 更新就诊记录
async function updateVisit(visitId) {
    // 简单验证
    const chiefComplaint = document.getElementById('chief-complaint-edit').value;
    const diagnosis = document.getElementById('diagnosis-edit').value;
    const treatment = document.getElementById('treatment-edit').value;

    if (!chiefComplaint || !diagnosis || !treatment) {
        alert('请填写必要信息');
        return;
    }

    const updatedVisit = {
        id: visitId,
        patientId: currentPatient.id,
        date: document.getElementById('visit-date-edit').value,
        chiefComplaint,
        diagnosis,
        treatment,
        nextAppointment: document.getElementById('next-appointment-edit').value
    };

    try {
        // 在实际应用中替换为API调用
        // const response = await fetch(`/api/v1/visits/${visitId}`, {
        //     method: 'PUT',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(updatedVisit)
        // });
        // const result = await response.json();

        // 重新加载患者详情
        viewPatientDetails(currentPatient.id);

        // 显示成功消息
        alert('就诊记录更新成功');
    } catch (error) {
        console.error('更新就诊记录失败:', error);
        alert('更新就诊记录失败，请稍后重试');
    }
}

// 保存患者病历（用于其他组件调用）
function savePatientRecord() {
    // 实现保存逻辑
    alert('病历保存成功');
}
// 医疗报告生成组件 - 添加到main.js文件中

// 初始化医疗报告功能
function initReports() {
    // 绑定生成报告按钮事件
    const generateReportBtn = document.getElementById('generate-report-button');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', showReportGenerator);
    }

    // 加载已有报告列表
    loadReportsList();
}

// 加载报告列表
async function loadReportsList() {
    const reportsListContainer = document.getElementById('reports-list');
    if (!reportsListContainer) return;

    reportsListContainer.innerHTML = '<div class="spinner-border text-primary" role="status"></div>';

    try {
        // 在实际应用中替换为API调用
        // const response = await fetch('/api/v1/reports');
        // const reports = await response.json();

        // 模拟数据
        const reports = [
            { id: 1, title: '李四 - 季度健康评估', type: '健康评估', date: '2025-03-15', patientId: 2 },
            { id: 2, title: '王五 - 肝功能检查报告', type: '检查报告', date: '2025-03-14', patientId: 3 },
            { id: 3, title: '张三 - 治疗进展总结', type: '治疗总结', date: '2025-03-15', patientId: 1 }
        ];

        renderReportsList(reports);
    } catch (error) {
        console.error('加载报告列表失败:', error);
        reportsListContainer.innerHTML = '<div class="alert alert-danger">加载报告列表失败</div>';
    }
}

// 渲染报告列表
function renderReportsList(reports) {
    const reportsListContainer = document.getElementById('reports-list');
    reportsListContainer.innerHTML = '';

    if (reports.length === 0) {
        reportsListContainer.innerHTML = '<div class="alert alert-info">暂无报告</div>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'table table-striped table-hover';

    table.innerHTML = `
        <thead>
            <tr>
                <th>报告标题</th>
                <th>类型</th>
                <th>日期</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody>
            ${reports.map(report => `
                <tr>
                    <td>${report.title}</td>
                    <td><span class="badge bg-secondary">${report.type}</span></td>
                    <td>${report.date}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary view-report-btn" data-id="${report.id}">
                            查看
                        </button>
                        <button class="btn btn-sm btn-outline-secondary print-report-btn" data-id="${report.id}">
                            打印
                        </button>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;

    reportsListContainer.appendChild(table);

    // 绑定按钮事件
    document.querySelectorAll('.view-report-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const reportId = parseInt(e.target.getAttribute('data-id'));
            viewReport(reportId, reports);
        });
    });

    document.querySelectorAll('.print-report-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const reportId = parseInt(e.target.getAttribute('data-id'));
            printReport(reportId, reports);
        });
    });
}

// 显示报告生成器
function showReportGenerator() {
    const reportsContainer = document.getElementById('reports-container');
    if (!reportsContainer) return;

    reportsContainer.innerHTML = `
        <div class="card">
            <div class="card-header bg-primary text-white">
                <h5 class="card-title mb-0">生成新报告</h5>
            </div>
            <div class="card-body">
                <form id="report-generator-form">
                    <div class="mb-3">
                        <label for="report-type" class="form-label">报告类型</label>
                        <select class="form-select" id="report-type" required>
                            <option value="">请选择报告类型</option>
                            <option value="health_assessment">健康评估报告</option>
                            <option value="lab_results">检验报告</option>
                            <option value="treatment_summary">治疗总结报告</option>
                            <option value="referral">转诊报告</option>
                            <option value="follow_up">随访报告</option>
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label for="patient-select" class="form-label">选择患者</label>
                        <select class="form-select" id="patient-select" required>
                            <option value="">请选择患者</option>
                            ${patients.map(patient => `
                                <option value="${patient.id}">${patient.name} (${patient.gender}, ${patient.age}岁)</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label for="report-title" class="form-label">报告标题</label>
                        <input type="text" class="form-control" id="report-title" required>
                    </div>
                    
                    <div class="mb-3">
                        <label for="report-date" class="form-label">报告日期</label>
                        <input type="date" class="form-control" id="report-date" value="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    
                    <div class="mb-3">
                        <label for="report-content" class="form-label">报告内容</label>
                        <textarea class="form-control" id="report-content" rows="8" required></textarea>
                    </div>
                    
                    <div class="mb-3">
                        <label for="report-conclusion" class="form-label">结论与建议</label>
                        <textarea class="form-control" id="report-conclusion" rows="3" required></textarea>
                    </div>
                    
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="checkbox" id="use-ai-assist">
                        <label class="form-check-label" for="use-ai-assist">
                            使用AI辅助生成报告内容
                        </label>
                    </div>
                    
                    <div class="text-end">
                        <button type="button" class="btn btn-secondary me-2" id="cancel-report-btn">取消</button>
                        <button type="button" class="btn btn-primary" id="generate-report-confirm-btn">生成报告</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // 绑定事件
    document.getElementById('cancel-report-btn').addEventListener('click', () => {
        reportsContainer.innerHTML = '';
        loadReportsList();
    });

    document.getElementById('generate-report-confirm-btn').addEventListener('click', generateNewReport);

    // 添加报告类型变化事件
    document.getElementById('report-type').addEventListener('change', updateReportTemplate);

    // 添加AI辅助勾选事件
    document.getElementById('use-ai-assist').addEventListener('change', (e) => {
        if (e.target.checked) {
            generateAIContent();
        }
    });
}

// 根据报告类型更新模板
function updateReportTemplate() {
    const reportType = document.getElementById('report-type').value;
    const contentField = document.getElementById('report-content');
    const conclusionField = document.getElementById('report-conclusion');

    if (!contentField || !conclusionField) return;

    // 根据报告类型设置不同的模板
    switch (reportType) {
        case 'health_assessment':
            contentField.value = `一、基本情况：
患者...[请填写患者基本信息]

二、检查结果：
1. 生命体征：
   - 血压：
   - 心率：
   - 呼吸：
   - 体温：
2. 实验室检查：
   - 血常规：
   - 尿常规：
   - 血脂：

三、评估发现：
...`;
            conclusionField.value = '根据评估结果，建议...';
            break;

        case 'lab_results':
            contentField.value = `检验项目：
1. 血液常规：
2. 肝功能：
   - ALT: 
   - AST: 
   - 总胆红素: 
   - 直接胆红素: 
3. 肾功能：
   - 肌酐: 
   - 尿素氮: 

参考范围：
...`;
            conclusionField.value = '检验报告显示...';
            break;

        case 'treatment_summary':
            contentField.value = `治疗开始日期：
初始诊断：

治疗过程：
1. [首次治疗日期] - 
2. [随访日期] - 

治疗效果：
...`;
            conclusionField.value = '经过治疗，患者症状...';
            break;

        default:
            contentField.value = '';
            conclusionField.value = '';
    }
}

// 生成AI辅助内容
async function generateAIContent() {
    const reportType = document.getElementById('report-type').value;
    const patientId = document.getElementById('patient-select').value;

    if (!reportType || !patientId) {
        alert('请先选择报告类型和患者');
        document.getElementById('use-ai-assist').checked = false;
        return;
    }

    // 显示加载状态
    document.getElementById('report-content').value = '正在生成AI内容，请稍候...';
    document.getElementById('report-conclusion').value = '生成中...';

    try {
        // 在实际应用中替换为API调用
        // const response = await fetch('/api/v1/ai/generate_report', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify({
        //         report_type: reportType,
        //         patient_id: patientId
        //     })
        // });
        // const data = await response.json();

        // 模拟延迟和响应
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 根据选择的患者获取模拟数据
        const patient = patients.find(p => p.id === parseInt(patientId));

        // 模拟AI生成的内容
        let content = '';
        let conclusion = '';

        if (reportType === 'health_assessment') {
            content = `一、基本情况：
患者${patient.name}，${patient.gender}，${patient.age}岁，${patient.address || '无地址信息'}

二、检查结果：
1. 生命体征：
   - 血压：125/82 mmHg
   - 心率：76次/分
   - 呼吸：18次/分
   - 体温：36.5℃
2. 实验室检查：
   - 血常规：白细胞 6.2×10^9/L，血红蛋白 135 g/L，血小板 208×10^9/L
   - 尿常规：正常范围
   - 血脂：总胆固醇 4.8 mmol/L，甘油三酯 1.5 mmol/L

三、评估发现：
1. 患者目前整体健康状况良好，各项指标在正常范围内。
2. ${patient.medicalHistory ? '存在既往病史：' + patient.medicalHistory : '无明显既往病史'}.
3. ${patient.allergies ? '注意过敏史：' + patient.allergies : '无已知过敏史'}.`;

            conclusion = `根据评估结果，患者目前健康状况良好，建议：
1. 定期体检，保持良好生活习惯
2. 均衡饮食，适当运动，保持心理健康
3. 6个月后复查`;
        } else if (reportType === 'lab_results') {
            content = `检验项目：
1. 血液常规：
   - 白细胞：6.2×10^9/L (参考范围: 4.0-10.0×10^9/L)
   - 红细胞：4.5×10^12/L (参考范围: 3.5-5.5×10^12/L)
   - 血红蛋白：135 g/L (参考范围: 120-160 g/L)
   - 血小板：208×10^9/L (参考范围: 100-300×10^9/L)

2. 肝功能：
   - ALT: 25 U/L (参考范围: 0-40 U/L)
   - AST: 28 U/L (参考范围: 0-40 U/L)
   - 总胆红素: 15 μmol/L (参考范围: 5-21 μmol/L)
   - 直接胆红素: 3.5 μmol/L (参考范围: 0-7 μmol/L)

3. 肾功能：
   - 肌酐: 68 μmol/L (参考范围: 44-106 μmol/L)
   - 尿素氮: 5.2 mmol/L (参考范围: 3.2-7.1 mmol/L)`;

            conclusion = `检验报告显示患者各项指标均在正常参考范围内，无明显异常发现。建议患者保持良好生活习惯，定期复查。`;
        } else {
            content = `治疗开始日期：${new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0]}
初始诊断：${patient.gender === '男' ? '慢性胃炎' : '功能性消化不良'}

治疗过程：
1. [${new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0]}] - 初次就诊，主诉${patient.gender === '男' ? '上腹部不适、嗳气、反酸' : '上腹部胀痛，进食后加重'}，予以${patient.gender === '男' ? '质子泵抑制剂、胃黏膜保护剂' : '促胃动力药、抗焦虑药物'}治疗。
2. [${new Date(Date.now() - 15*24*60*60*1000).toISOString().split('T')[0]}] - 随访，症状有所缓解，继续原方案治疗。
3. [${new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0]}] - 复诊，症状明显改善，调整用药方案，减量治疗。

治疗效果：
患者治疗依从性好，目前症状明显缓解，生活质量改善。`;

            conclusion = `经过规范治疗，患者症状得到有效控制，建议：
1. 继续保持规律生活，避免辛辣刺激食物
2. 定时服药，按时复诊
3. 如症状加重及时就医`;
        }

        // 更新表单
        document.getElementById('report-content').value = content;
        document.getElementById('report-conclusion').value = conclusion;

        // 更新标题
        if (!document.getElementById('report-title').value) {
            let reportTitle = '';
            switch (reportType) {
                case 'health_assessment':
                    reportTitle = `${patient.name} - 健康评估报告`;
                    break;
                case 'lab_results':
                    reportTitle = `${patient.name} - 检验报告`;
                    break;
                case 'treatment_summary':
                    reportTitle = `${patient.name} - 治疗总结报告`;
                    break;
                default:
                    reportTitle = `${patient.name} - 医疗报告`;
            }
            document.getElementById('report-title').value = reportTitle;
        }
    } catch (error) {
        console.error('AI内容生成失败:', error);
        alert('AI内容生成失败，请稍后重试');
        document.getElementById('use-ai-assist').checked = false;
        document.getElementById('report-content').value = '';
        document.getElementById('report-conclusion').value = '';
    }
}

// 生成新报告
async function generateNewReport() {
    // 简单验证
    const reportType = document.getElementById('report-type').value;
    const patientId = document.getElementById('patient-select').value;
    const title = document.getElementById('report-title').value;
    const date = document.getElementById('report-date').value;
    const content = document.getElementById('report-content').value;
    const conclusion = document.getElementById('report-conclusion').value;

    if (!reportType || !patientId || !title || !date || !content || !conclusion) {
        alert('请填写所有必要字段');
        return;
    }

    const patient = patients.find(p => p.id === parseInt(patientId));
    if (!patient) {
        alert('请选择有效的患者');
        return;
    }

    const report = {
        id: Date.now(), // 在实际应用中，ID应由服务器生成
        title,
        patientId: parseInt(patientId),
        patientName: patient.name,
        type: document.getElementById('report-type').options[document.getElementById('report-type').selectedIndex].text,
        date,
        content,
        conclusion,
        createdAt: new Date().toISOString()
    };

    try {
        // 在实际应用中替换为API调用
        // const response = await fetch('/api/v1/reports', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(report)
        // });
        // const result = await response.json();

        // 显示报告预览
        previewReport(report);
    } catch (error) {
        console.error('生成报告失败:', error);
        alert('生成报告失败，请稍后重试');
    }
}

// 预览报告
function previewReport(report) {
    const reportsContainer = document.getElementById('reports-container');

    reportsContainer.innerHTML = `
        <div class="card">
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">报告预览</h5>
                <div>
                    <button class="btn btn-light btn-sm me-2" id="edit-report-btn">
                        <i class="bi bi-pencil me-1"></i>编辑
                    </button>
                    <button class="btn btn-light btn-sm" id="print-preview-btn">
                        <i class="bi bi-printer me-1"></i>打印
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="report-preview">
                    <div class="text-center mb-4">
                        <h3>${report.title}</h3>
                        <p class="text-muted">报告日期: ${report.date}</p>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <strong>患者姓名:</strong> ${report.patientName}
                        </div>
                        <div class="col-md-6">
                            <strong>报告类型:</strong> ${report.type}
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <h5>报告内容</h5>
                        <div class="border p-3 bg-light">
                            <pre style="white-space: pre-wrap;">${report.content}</pre>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <h5>结论与建议</h5>
                        <div class="border p-3 bg-light">
                            <pre style="white-space: pre-wrap;">${report.conclusion}</pre>
                        </div>
                    </div>
                    
                    <div class="text-end mt-3">
                        <p>医师签名: ________________</p>
                        <p>日期: ${new Date().toISOString().split('T')[0]}</p>
                    </div>
                </div>
                
                <div class="text-center mt-4">
                    <button class="btn btn-secondary me-2" id="back-to-list-btn">返回列表</button>
                    <button class="btn btn-success" id="save-report-btn">保存报告</button>
                </div>
            </div>
        </div>
    `;

    // 绑定事件
    document.getElementById('edit-report-btn').addEventListener('click', () => showReportGenerator());
    document.getElementById('print-preview-btn').addEventListener('click', () => window.print());
    document.getElementById('back-to-list-btn').addEventListener('click', () => {
        reportsContainer.innerHTML = '';
        loadReportsList();
    });
    document.getElementById('save-report-btn').addEventListener('click', () => saveReport(report));
}

// 保存报告
async function saveReport(report) {
    try {
        // 在实际应用中替换为API调用
        // const response = await fetch('/api/v1/reports', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(report)
        // });
        // const result = await response.json();

        // 模拟成功响应
        alert('报告保存成功');

        // 清空容器并加载列表
        const reportsContainer = document.getElementById('reports-container');
        reportsContainer.innerHTML = '';
        loadReportsList();
    } catch (error) {
        console.error('保存报告失败:', error);
        alert('保存报告失败，请稍后重试');
    }
}

// 查看报告
function viewReport(reportId, reportsList) {
    const report = reportsList.find(r => r.id === reportId);
    if (!report) {
        alert('报告不存在');
        return;
    }

    // 模拟报告详情数据
    const reportDetails = {
        ...report,
        content: `患者${report.title.split(' - ')[0]}，男，58岁，于2025年03月15日就诊。

主诉：上腹部不适3周，进食后加重。

检查结果：
1. 肝功能：
   - ALT: 35 U/L (参考范围: 0-40 U/L)
   - AST: 32 U/L (参考范围: 0-40 U/L)
   - GGT: 45 U/L (参考范围: 10-60 U/L)
   - ALP: 90 U/L (参考范围: 45-125 U/L)
   - 总胆红素: 18 μmol/L (参考范围: 5-21 μmol/L)

2. 超声检查：
   肝脏形态正常，大小正常，实质回声均匀，肝内血管走行规则，未见明显占位性病变。`,
        conclusion: '患者肝功能指标在正常范围内，影像学检查未见明显异常。建议定期复查肝功能，保持健康生活方式，避免饮酒和服用肝毒性药物。'
    };

    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = `report-view-${reportId}`;
    modal.tabIndex = '-1';

    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title">${reportDetails.title}</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <div>
                                <strong>报告类型:</strong> ${reportDetails.type}
                            </div>
                            <div>
                                <strong>日期:</strong> ${reportDetails.date}
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <h6>报告内容</h6>
                        <div class="border p-3 bg-light">
                            <pre style="white-space: pre-wrap;">${reportDetails.content}</pre>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <h6>结论与建议</h6>
                        <div class="border p-3 bg-light">
                            <pre style="white-space: pre-wrap;">${reportDetails.conclusion}</pre>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                    <button type="button" class="btn btn-primary print-modal-btn">
                        <i class="bi bi-printer me-1"></i>打印
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 显示模态框
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    // 模态框关闭时移除DOM
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });

    // 绑定打印按钮事件
    modal.querySelector('.print-modal-btn').addEventListener('click', () => {
        modalInstance.hide();
        printReport(reportId, reportsList);
    });
}

// 打印报告
function printReport(reportId, reportsList) {
    const report = reportsList.find(r => r.id === reportId);
    if (!report) {
        alert('报告不存在');
        return;
    }

    // 模拟报告详情数据
    const reportDetails = {
        ...report,
        content: `患者${report.title.split(' - ')[0]}，男，58岁，于2025年03月15日就诊。

主诉：上腹部不适3周，进食后加重。

检查结果：
1. 肝功能：
   - ALT: 35 U/L (参考范围: 0-40 U/L)
   - AST: 32 U/L (参考范围: 0-40 U/L)
   - GGT: 45 U/L (参考范围: 10-60 U/L)
   - ALP: 90 U/L (参考范围: 45-125 U/L)
   - 总胆红素: 18 μmol/L (参考范围: 5-21 μmol/L)

2. 超声检查：
   肝脏形态正常，大小正常，实质回声均匀，肝内血管走行规则，未见明显占位性病变。`,
        conclusion: '患者肝功能指标在正常范围内，影像学检查未见明显异常。建议定期复查肝功能，保持健康生活方式，避免饮酒和服用肝毒性药物。'
    };

    // 创建打印窗口
    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${reportDetails.title}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    margin: 20px;
                }
                .report-header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .report-header h2 {
                    margin-bottom: 5px;
                }
                .report-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }
                .report-section {
                    margin-bottom: 20px;
                }
                .report-section h3 {
                    border-bottom: 1px solid #ccc;
                    padding-bottom: 5px;
                    margin-bottom: 10px;
                }
                .report-content {
                    white-space: pre-wrap;
                }
                .report-footer {
                    margin-top: 30px;
                    text-align: right;
                }
                @media print {
                    body {
                        margin: 0;
                        padding: 15px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="report-header">
                <h2>${reportDetails.title}</h2>
                <p>报告日期: ${reportDetails.date}</p>
            </div>
            
            <div class="report-info">
                <div>
                    <strong>报告类型:</strong> ${reportDetails.type}
                </div>
            </div>
            
            <div class="report-section">
                <h3>报告内容</h3>
                <div class="report-content">
                    ${reportDetails.content}
                </div>
            </div>
            
            <div class="report-section">
                <h3>结论与建议</h3>
                <div class="report-content">
                    ${reportDetails.conclusion}
                </div>
            </div>
            
            <div class="report-footer">
                <p>医师签名: ________________</p>
                <p>日期: ${reportDetails.date}</p>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);

    printWindow.document.close();
}

// 从其他组件调用的生成报告方法
function generateMedicalReport(visit) {
    if (!visit || !currentPatient) return;

    // 切换到报告标签页
    document.querySelector('a[href="#reports"]').click();

    // 显示报告生成器
    showReportGenerator();

    // 预填充报告内容
    setTimeout(() => {
        document.getElementById('report-type').value = 'treatment_summary';
        document.getElementById('patient-select').value = currentPatient.id;
        document.getElementById('report-title').value = `${currentPatient.name} - 就诊总结报告`;
        document.getElementById('report-date').value = visit.date;

        // 生成报告内容
        const content = `治疗日期：${visit.date}
患者信息：${currentPatient.name}，${currentPatient.gender}，${currentPatient.age}岁

主诉：
${visit.chiefComplaint}

诊断：
${visit.diagnosis}

治疗方案：
${visit.treatment}

${visit.nextAppointment ? `下次随访日期：${visit.nextAppointment}` : ''}`;

        document.getElementById('report-content').value = content;
        document.getElementById('report-conclusion').value = '患者目前按照治疗方案进行治疗，症状有所缓解。建议继续遵医嘱，按时服药，定期复诊。';

        updateReportTemplate();
    }, 500);
}