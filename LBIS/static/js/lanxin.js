// 兰心慧诊系统前端交互脚本

// 页面导航
document.querySelectorAll('.sidebar .nav-link').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();

        // 更新导航状态
        document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');

        // 显示对应内容
        const section = this.getAttribute('data-section');
        document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
        document.getElementById(section + '-section').style.display = 'block';
    });
});

// 首页模块卡片点击
document.querySelectorAll('.module-card').forEach(card => {
    card.addEventListener('click', function () {
        const module = this.getAttribute('data-module');
        const link = document.querySelector(`.nav-link[data-section="${module}"]`);
        if (link) link.click();
    });
});

// 疾病问诊 - 聊天功能
document.getElementById('send-chat')?.addEventListener('click', sendChatMessage);
document.getElementById('chat-input')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') sendChatMessage();
});

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    const container = document.getElementById('chat-container');

    // 添加用户消息
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.textContent = message;
    container.appendChild(userMsg);

    input.value = '';
    container.scrollTop = container.scrollHeight;

    // 调用API
    fetch('/api/v1/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: message })
    })
        .then(res => res.json())
        .then(data => {
            const assistantMsg = document.createElement('div');
            assistantMsg.className = 'chat-message assistant';
            assistantMsg.textContent = data.answer || '抱歉，我暂时无法回答这个问题。';
            container.appendChild(assistantMsg);
            container.scrollTop = container.scrollHeight;
        })
        .catch(err => console.error('Error:', err));
}

// 加载症状清单
document.getElementById('load-symptoms')?.addEventListener('click', function () {
    const tumorType = document.getElementById('tumor-type-select').value;

    fetch(`/api/diagnosis/symptom-collection/${tumorType}`)
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('symptom-checklist');
            container.innerHTML = '<h6 class="mt-3">症状清单</h6>';

            if (data.symptom_checklist) {
                data.symptom_checklist.forEach(symptom => {
                    const div = document.createElement('div');
                    div.className = 'form-check';
                    div.innerHTML = `
                    <input class="form-check-input" type="checkbox" value="${symptom}" id="symptom-${symptom}">
                    <label class="form-check-label" for="symptom-${symptom}">${symptom}</label>
                `;
                    container.appendChild(div);
                });

                // 添加评估按钮
                const btn = document.createElement('button');
                btn.className = 'btn btn-primary-custom btn-sm w-100 mt-3';
                btn.textContent = '进行风险评估';
                btn.onclick = performRiskAssessment;
                container.appendChild(btn);
            }
        })
        .catch(err => console.error('Error:', err));
});

// 风险评估
function performRiskAssessment() {
    const symptoms = [];
    document.querySelectorAll('#symptom-checklist input:checked').forEach(cb => {
        symptoms.push(cb.value);
    });

    const data = {
        age: 45, // 示例数据
        symptoms: symptoms,
        family_history: false
    };

    fetch('/api/diagnosis/risk-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(result => {
            const container = document.getElementById('risk-assessment-result');
            container.innerHTML = `
            <div class="alert alert-${result.risk_level === '高风险' ? 'danger' : result.risk_level === '中风险' ? 'warning' : 'success'}">
                <h6>风险等级: ${result.risk_level}</h6>
                <p>风险评分: ${result.risk_score}</p>
                <p>${result.recommendation}</p>
            </div>
        `;
        })
        .catch(err => console.error('Error:', err));
}

// 预后预测
document.getElementById('predict-prognosis')?.addEventListener('click', function () {
    const form = document.getElementById('prognosis-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // 生存预测
    fetch('/api/prognosis/survival-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(result => {
            const container = document.getElementById('survival-prediction-result');
            let html = '<h6>生存率预测</h6><table class="table table-sm">';
            for (const [period, rate] of Object.entries(result.survival_rates)) {
                html += `<tr><td>${period}生存率</td><td>${(rate * 100).toFixed(1)}%</td></tr>`;
            }
            html += `</table><p class="text-muted">中位生存期: ${result.median_survival}</p>`;
            container.innerHTML = html;
        })
        .catch(err => console.error('Error:', err));

    // 复发风险评估
    fetch('/api/prognosis/recurrence-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            patient_data: data,
            treatment_history: { complete: true }
        })
    })
        .then(res => res.json())
        .then(result => {
            const container = document.getElementById('recurrence-risk-result');
            container.innerHTML = `
            <div class="alert alert-info">
                <h6>${result.risk_level}</h6>
                <p>复发风险评分: ${result.recurrence_risk_score}</p>
                <p>随访建议: ${result.follow_up_schedule}</p>
                <p>高风险期: ${result.high_risk_period}</p>
            </div>
        `;
        })
        .catch(err => console.error('Error:', err));
});

// 病历生成
document.getElementById('generate-record')?.addEventListener('click', function () {
    const form = document.getElementById('medical-record-form');
    const formData = new FormData(form);
    const patientInfo = Object.fromEntries(formData);

    const data = {
        patient_info: patientInfo,
        diagnosis_info: {
            preliminary_diagnosis: '待确诊',
            final_diagnosis: ''
        },
        tumor_type: '宫颈癌'
    };

    fetch('/api/medical-record/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(result => {
            const container = document.getElementById('generated-record');
            container.innerHTML = `
            <h6>电子病历</h6>
            <p><strong>病历号:</strong> ${result.record_id}</p>
            <p><strong>患者姓名:</strong> ${result.patient_info.name}</p>
            <p><strong>年龄:</strong> ${result.patient_info.age}</p>
            <p><strong>主诉:</strong> ${result.chief_complaint}</p>
            <p><strong>现病史:</strong> ${result.present_illness}</p>
            <p><strong>科室:</strong> ${result.department}</p>
            <p><strong>创建时间:</strong> ${new Date(result.created_at).toLocaleString()}</p>
        `;
        })
        .catch(err => console.error('Error:', err));
});

// 智能问答
document.getElementById('send-qa')?.addEventListener('click', sendQAMessage);
document.getElementById('qa-input')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') sendQAMessage();
});

function sendQAMessage() {
    const input = document.getElementById('qa-input');
    const message = input.value.trim();
    if (!message) return;

    const container = document.getElementById('qa-chat-container');

    // 添加用户消息
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.textContent = message;
    container.appendChild(userMsg);

    input.value = '';
    container.scrollTop = container.scrollHeight;

    // 调用API
    fetch('/api/v1/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: message })
    })
        .then(res => res.json())
        .then(data => {
            const assistantMsg = document.createElement('div');
            assistantMsg.className = 'chat-message assistant';
            assistantMsg.textContent = data.answer || '抱歉，我暂时无法回答这个问题。';
            container.appendChild(assistantMsg);
            container.scrollTop = container.scrollHeight;
        })
        .catch(err => console.error('Error:', err));
}

// 快速问题点击
document.querySelectorAll('.qa-quick-question').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('qa-input').value = this.textContent;
        sendQAMessage();
    });
});

// 导出病历
document.getElementById('export-record')?.addEventListener('click', function () {
    alert('病历导出功能开发中...');
});
