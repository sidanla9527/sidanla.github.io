/**
 * 稿费扣税计算器 - 网页版 JavaScript
 * 基于中国稿费税率计算方法
 */

// 税率配置
const TAX_CONFIG = {
    THRESHOLD: 4000,        // 阈值（元）
    DEDUCTION_LOW: 800,     // 低收入扣除额（元）
    DEDUCTION_RATE: 0.2,    // 高收入扣除率（20%）
    TAX_RATE: 0.2,          // 税率（20%）
    REDUCTION_RATE: 0.3     // 减征率（30%）
};

// DOM 元素
const elements = {
    amount: document.getElementById('amount'),
    authors: document.getElementById('authors'),
    calculateBtn: document.getElementById('calculateBtn'),
    resetBtn: document.getElementById('resetBtn'),
    saveBtn: document.getElementById('saveBtn'),
    exportBtn: document.getElementById('exportBtn'),
    printBtn: document.getElementById('printBtn'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    
    // 结果元素
    totalAmount: document.getElementById('totalAmount'),
    authorsCount: document.getElementById('authorsCount'),
    perAuthor: document.getElementById('perAuthor'),
    taxableIncome: document.getElementById('taxableIncome'),
    taxRate: document.getElementById('taxRate'),
    taxAmount: document.getElementById('taxAmount'),
    reductionAmount: document.getElementById('reductionAmount'),
    actualTax: document.getElementById('actualTax'),
    netIncome: document.getElementById('netIncome'),
    netPercentage: document.getElementById('netPercentage'),
    
    // 进度条
    percentageBar: document.getElementById('percentageBar'),
    percentageText: document.getElementById('percentageText'),
    
    // 详细计算过程
    calculationSteps: document.getElementById('calculationSteps'),
    
    // 历史记录
    historyList: document.getElementById('historyList'),
    
    // 模态框
    modal: document.getElementById('resultModal'),
    modalMessage: document.getElementById('modalMessage'),
    modalTotal: document.getElementById('modalTotal'),
    modalNet: document.getElementById('modalNet'),
    modalPercentage: document.getElementById('modalPercentage'),
    modalOkBtn: document.getElementById('modalOkBtn'),
    modalSaveBtn: document.getElementById('modalSaveBtn'),
    closeBtn: document.querySelector('.close-btn')
};

// 当前计算结果
let currentResult = null;
let calculationHistory = [];

/**
 * 初始化应用
 */
function initApp() {
    // 加载历史记录
    loadHistory();
    
    // 绑定事件
    bindEvents();
    
    // 设置默认值
    elements.amount.focus();
    
    console.log('稿费扣税计算器已初始化');
}

/**
 * 绑定所有事件
 */
function bindEvents() {
    // 计算按钮
    elements.calculateBtn.addEventListener('click', calculateTax);
    
    // 输入框回车键
    elements.amount.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateTax();
    });
    elements.authors.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateTax();
    });
    
    // 操作按钮
    elements.resetBtn.addEventListener('click', resetCalculator);
    elements.saveBtn.addEventListener('click', saveResult);
    elements.exportBtn.addEventListener('click', exportResult);
    elements.printBtn.addEventListener('click', printResult);
    elements.clearHistoryBtn.addEventListener('click', clearHistory);
    
    // 模态框按钮
    elements.modalOkBtn.addEventListener('click', closeModal);
    elements.modalSaveBtn.addEventListener('click', saveResultFromModal);
    elements.closeBtn.addEventListener('click', closeModal);
    
    // 点击模态框外部关闭
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) closeModal();
    });
    
    // 输入框实时验证
    elements.amount.addEventListener('input', validateAmount);
    elements.authors.addEventListener('input', validateAuthors);
}

/**
 * 验证稿费金额
 */
function validateAmount() {
    const value = parseFloat(elements.amount.value);
    if (value < 0) {
        elements.amount.value = '';
        showToast('稿费金额不能为负数', 'error');
    }
}

/**
 * 验证作者人数
 */
function validateAuthors() {
    const value = parseInt(elements.authors.value);
    if (value < 1) {
        elements.authors.value = '1';
        showToast('作者人数必须大于0', 'error');
    }
    if (value > 100) {
        elements.authors.value = '100';
        showToast('作者人数不能超过100', 'error');
    }
}

/**
 * 计算稿费扣税
 */
function calculateTax() {
    try {
        // 获取输入值
        const amount = parseFloat(elements.amount.value);
        const authors = parseInt(elements.authors.value);
        
        // 验证输入
        if (isNaN(amount) || amount <= 0) {
            showToast('请输入有效的稿费金额', 'error');
            elements.amount.focus();
            return;
        }
        
        if (isNaN(authors) || authors < 1) {
            showToast('请输入有效的作者人数', 'error');
            elements.authors.focus();
            return;
        }
        
        // 计算人均稿费
        const perAuthor = amount / authors;
        
        // 计算应纳税所得额
        let taxableIncome, deductionType;
        if (perAuthor <= TAX_CONFIG.THRESHOLD) {
            // 收入≤4000元：应纳税所得额 = 稿费收入 - 800元
            taxableIncome = Math.max(0, perAuthor - TAX_CONFIG.DEDUCTION_LOW);
            deductionType = `扣除固定额 ${TAX_CONFIG.DEDUCTION_LOW} 元`;
        } else {
            // 收入＞4000元：应纳税所得额 = 稿费收入 × (1 - 20%)
            taxableIncome = perAuthor * (1 - TAX_CONFIG.DEDUCTION_RATE);
            deductionType = `扣除比例 ${(TAX_CONFIG.DEDUCTION_RATE * 100).toFixed(0)}%`;
        }
        
        // 计算应纳税额（税前）
        const taxBeforeReduction = taxableIncome * TAX_CONFIG.TAX_RATE;
        
        // 计算减征税额（稿酬所得减征30%）
        const reductionAmount = taxBeforeReduction * TAX_CONFIG.REDUCTION_RATE;
        
        // 计算实际缴税额
        const actualTax = taxBeforeReduction - reductionAmount;
        
        // 计算实际到手金额
        const netIncome = perAuthor - actualTax;
        
        // 计算到手比例
        const netPercentage = (netIncome / perAuthor) * 100;
        
        // 保存计算结果
        currentResult = {
            timestamp: new Date().toISOString(),
            amount,
            authors,
            perAuthor,
            taxableIncome,
            taxBeforeReduction,
            reductionAmount,
            actualTax,
            netIncome,
            netPercentage,
            deductionType
        };
        
        // 更新界面
        updateResultDisplay();
        updateCalculationSteps();
        updateProgressBar(netPercentage);
        
        // 添加到历史记录
        addToHistory();
        
        // 显示成功模态框
        showModal();
        
        console.log('计算完成:', currentResult);
        
    } catch (error) {
        console.error('计算错误:', error);
        showToast('计算过程中出现错误: ' + error.message, 'error');
    }
}

/**
 * 更新结果显示
 */
function updateResultDisplay() {
    if (!currentResult) return;
    
    const formatCurrency = (value) => {
        return value.toLocaleString('zh-CN', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    };
    
    const formatPercentage = (value) => {
        return value.toFixed(1);
    };
    
    // 更新所有结果
    elements.totalAmount.textContent = formatCurrency(currentResult.amount);
    elements.authorsCount.textContent = currentResult.authors;
    elements.perAuthor.textContent = formatCurrency(currentResult.perAuthor);
    elements.taxableIncome.textContent = formatCurrency(currentResult.taxableIncome);
    elements.taxRate.textContent = (TAX_CONFIG.TAX_RATE * 100).toFixed(1);
    elements.taxAmount.textContent = formatCurrency(currentResult.taxBeforeReduction);
    elements.reductionAmount.textContent = formatCurrency(currentResult.reductionAmount);
    elements.actualTax.textContent = formatCurrency(currentResult.actualTax);
    elements.netIncome.textContent = formatCurrency(currentResult.netIncome);
    elements.netPercentage.textContent = formatPercentage(currentResult.netPercentage);
}

/**
 * 更新进度条
 */
function updateProgressBar(percentage) {
    const safePercentage = Math.min(Math.max(percentage, 0), 100);
    elements.percentageBar.style.width = safePercentage + '%';
    elements.percentageText.textContent = safePercentage.toFixed(1) + '%';
}

/**
 * 更新详细计算过程
 */
function updateCalculationSteps() {
    if (!currentResult) return;
    
    const steps = `
        <div class="calculation-step">
            <h4>1. 输入数据</h4>
            <p>稿费总额：${currentResult.amount.toLocaleString()} 元</p>
            <p>作者人数：${currentResult.authors} 人</p>
            <p>人均稿费：${currentResult.perAuthor.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 元</p>
        </div>
        
        <div class="calculation-step">
            <h4>2. 计算应纳税所得额</h4>
            <p>人均稿费 ${currentResult.perAuthor <= TAX_CONFIG.THRESHOLD ? '≤' : '>'} ${TAX_CONFIG.THRESHOLD} 元</p>
            <p>采用计算方式：${currentResult.deductionType}</p>
            <p>应纳税所得额 = ${currentResult.taxableIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 元</p>
        </div>
        
        <div class="calculation-step">
            <h4>3. 计算应纳税额</h4>
            <p>应纳税额 = 应纳税所得额 × 税率</p>
            <p>${currentResult.taxableIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} × ${(TAX_CONFIG.TAX_RATE * 100).toFixed(0)}%</p>
            <p>= ${currentResult.taxBeforeReduction.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 元</p>
        </div>
        
        <div class="calculation-step">
            <h4>4. 计算减征税额</h4>
            <p>稿酬所得减征 ${(TAX_CONFIG.REDUCTION_RATE * 100).toFixed(0)}%</p>
            <p>减征税额 = 应纳税额 × ${(TAX_CONFIG.REDUCTION_RATE * 100).toFixed(0)}%</p>
            <p>${currentResult.taxBeforeReduction.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} × ${(TAX_CONFIG.REDUCTION_RATE * 100).toFixed(0)}%</p>
            <p>= ${currentResult.reductionAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 元</p>
        </div>
        
        <div class="calculation-step">
            <h4>5. 计算最终结果</h4>
            <p>实际缴税额 = 应纳税额 - 减征税额</p>
            <p>${currentResult.taxBeforeReduction.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} - ${currentResult.reductionAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
            <p>= ${currentResult.actualTax.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 元</p>
            
            <p>实际到手金额 = 人均稿费 - 实际缴税额</p>
            <p>${currentResult.perAuthor.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} - ${currentResult.actualTax.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
            <p>= ${currentResult.netIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 元</p>
            
            <p>到手比例：${currentResult.netPercentage.toFixed(1)}%</p>
        </div>
    `;
    
    elements.calculationSteps.innerHTML = steps;
}

/**
 * 显示模态框
 */
function showModal() {
    if (!currentResult) return;
    
    // 更新模态框内容
    elements.modalTotal.textContent = currentResult.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) + ' 元';
    elements.modalNet.textContent = currentResult.netIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) + ' 元';
    elements.modalPercentage.textContent = currentResult.netPercentage.toFixed(1) + '%';
    
    // 显示模态框
    elements.modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * 关闭模态框
 */
function closeModal() {
    elements.modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

/**
 * 重置计算器
 */
function resetCalculator() {
    // 清空输入
    elements.amount.value = '';
    elements.authors.value = '1';
    
    // 清空结果
    elements.totalAmount.textContent = '--';
    elements.authorsCount.textContent = '--';
    elements.perAuthor.textContent = '--';
    elements.taxableIncome.textContent = '--';
    elements.taxRate.textContent = '--';
    elements.taxAmount.textContent = '--';
    elements.reductionAmount.textContent = '--';
    elements.actualTax.textContent = '--';
    elements.netIncome.textContent = '--';
    elements.netPercentage.textContent = '--';
    
    // 重置进度条
    updateProgressBar(0);
    
    // 清空详细计算过程
    elements.calculationSteps.innerHTML = '<p class="empty-state">请先输入稿费金额进行计算</p>';
    
    // 清空当前结果
    currentResult = null;
    
    // 焦点回到输入框
    elements.amount.focus();
    
    showToast('计算器已重置', 'success');
}

/**
 * 保存结果
 */
function saveResult() {
    if (!currentResult) {
        showToast('请先进行计算', 'warning');
        return;
    }
    
    // 添加到历史记录（如果尚未添加）
    addToHistory();
    
    // 保存到本地存储
    saveHistory();
    
    showToast('结果已保存到历史记录', 'success');
}

/**
 * 从模态框保存结果
 */
function saveResultFromModal() {
    saveResult();
    closeModal();
}

/**
 * 导出结果为文本文件
 */
function exportResult() {
    if (!currentResult) {
        showToast('请先进行计算', 'warning');
        return;
    }
    
    const timestamp = new Date().toLocaleString('zh-CN');
    const content = `
稿费扣税计算结果
================
计算时间：${timestamp}

输入信息：
- 稿费总额：${currentResult.amount.toLocaleString()} 元
- 作者人数：${currentResult.authors} 人

计算结果：
- 人均稿费：${currentResult.perAuthor.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 元
- 应纳税所得额：${currentResult.taxableIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 元
- 应纳税额：${currentResult.taxBeforeReduction.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 元
- 减征税额：${currentResult.reductionAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 元
- 实际缴税额：${currentResult.actualTax.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 元
- 实际到手金额：${currentResult.netIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 元
- 到手比例：${currentResult.netPercentage.toFixed(1)}%

计算方法：
根据《中华人民共和国个人所得税法》规定：
1. 稿酬所得每次收入≤4000元：应纳税所得额=收入-800元
2. 稿酬所得每次收入＞4000元：应纳税所得额=收入×(1-20%)
3. 稿酬所得减征30%：应纳税额=应纳税所得额×20%×70%

© 稿费扣税计算器 网页版
    `.trim();
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `稿费计算结果_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('结果已导出为文本文件', 'success');
}

/**
 * 打印结果
 */
function printResult() {
    if (!currentResult) {
        showToast('请先进行计算', 'warning');
        return;
    }
    
    window.print();
}

/**
 * 添加到历史记录
 */
function addToHistory() {
    if (!currentResult) return;
    
    const historyItem = {
        ...currentResult,
        id: Date.now(),
        displayTime: new Date().toLocaleString('zh-CN')
    };
    
    // 添加到数组开头
    calculationHistory.unshift(historyItem);
    
    // 限制历史记录数量
    if (calculationHistory.length > 20) {
        calculationHistory = calculationHistory.slice(0, 20);
    }
    
    // 更新界面
    updateHistoryDisplay();
    
    // 保存到本地存储
    saveHistory();
}

/**
 * 更新历史记录显示
 */
function updateHistoryDisplay() {
    if (calculationHistory.length === 0) {
        elements.historyList.innerHTML = '<p class="empty-state">暂无计算历史</p>';
        return;
    }
    
    const historyHTML = calculationHistory.map(item => `
        <div class="history-item">
            <div class="history-info">
                <div class="history-amount">${item.amount.toLocaleString()} 元 (${item.authors}人)</div>
                <div class="history-time">${item.displayTime}</div>
            </div>
            <div class="history-result">
                <strong>到手：${item.netIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 元</strong>
            </div>
        </div>
    `).join('');
    
    elements.historyList.innerHTML = historyHTML;
}

/**
 * 保存历史记录到本地存储
 */
function saveHistory() {
    try {
        localStorage.setItem('royaltyCalculatorHistory', JSON.stringify(calculationHistory));
    } catch (error) {
        console.error('保存历史记录失败:', error);
        showToast('保存历史记录失败', 'error');
    }
}

/**
 * 加载历史记录
 */
function loadHistory() {
    try {
        const saved = localStorage.getItem('royaltyCalculatorHistory');
        if (saved) {
            calculationHistory = JSON.parse(saved);
            updateHistoryDisplay();
        }
    } catch (error) {
        console.error('加载历史记录失败:', error);
        calculationHistory = [];
    }
}

/**
 * 清空历史记录
 */
function clearHistory() {
    if (calculationHistory.length === 0) {
        showToast('历史记录已为空', 'info');
        return;
    }
    
    if (confirm('确定要清空所有历史记录吗？')) {
        calculationHistory = [];
        localStorage.removeItem('royaltyCalculatorHistory');
        updateHistoryDisplay();
        showToast('历史记录已清空', 'success');
    }
}

/**
 * 显示提示消息
 */
function showToast(message, type = 'info') {
    // 移除之前的提示
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    // 创建新的提示
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 显示动画
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // 自动消失
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

/**
 * 创建提示样式
 */
function createToastStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
        }
        .toast.show {
            opacity: 1;
            transform: translateX(0);
        }
        .toast-success {
            background: #2ecc71;
        }
        .toast-error {
            background: #e74c3c;
        }
        .toast-warning {
            background: #f39c12;
        }
        .toast-info {
            background: #3498db;
        }
    `;
    document.head.appendChild(style);
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    createToastStyles();
    initApp();
});

// 导出到全局作用域（用于调试）
window.RoyaltyCalculator = {
    calculateTax,
    resetCalculator,
    saveResult,
    exportResult,
    printResult,
    clearHistory,
    currentResult,
    calculationHistory
};