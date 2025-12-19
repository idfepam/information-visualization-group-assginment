import { state } from './state.js';
import { normalizeValue, euclideanDistance } from './utils.js';

// K-ближайших соседей для предсказания с учетом параметров займа
function predictLoanApproval(inputValues, loanParams, k = 15) {
    if (!state.customerData || state.customerData.length === 0) return 0.5;
    
    // Фильтруем клиентов по параметрам займа (тип продукта и намерение)
    const filteredCustomers = state.customerData.filter(customer => 
        customer.product_type === loanParams.productType &&
        customer.loan_intent === loanParams.loanIntent
    );
    
    // Если нет подходящих клиентов, используем всех
    const customersToUse = filteredCustomers.length > 0 ? filteredCustomers : state.customerData;
    
    // Нормализуем входные данные
    const normalizedInput = [
        normalizeValue(inputValues[0], 300, 850),      // credit_score
        normalizeValue(inputValues[1], 25000, 175000),   // annual_income
        normalizeValue(inputValues[2], 0, 100000),        // current_debt
        normalizeValue(inputValues[3], 0, 20),            // years_employed
        normalizeValue(inputValues[4], 0, 150000),       // savings_assets
        normalizeValue(inputValues[5], 0, 100),           // dti_ratio
        normalizeValue(loanParams.loanAmount, 0, 200000)  // loan_amount
    ];
    
    // Вычисляем расстояния до всех точек в отфильтрованном датасете
    const distances = customersToUse.map(customer => {
        const customerValues = [
            normalizeValue(parseFloat(customer.credit_score), 300, 850),
            normalizeValue(parseFloat(customer.annual_income), 25000, 175000),
            normalizeValue(parseFloat(customer.current_debt), 0, 100000),
            normalizeValue(parseFloat(customer.years_employed), 0, 20),
            normalizeValue(parseFloat(customer.savings_assets), 0, 150000),
            normalizeValue(parseFloat(customer.debt_to_income_ratio) * 100, 0, 100),
            normalizeValue(parseFloat(customer.loan_amount), 0, 200000)
        ];
        
        return {
            distance: euclideanDistance(normalizedInput, customerValues),
            status: parseInt(customer.loan_status)
        };
    });
    
    // Сортируем по расстоянию и берем k ближайших
    distances.sort((a, b) => a.distance - b.distance);
    const kNearest = distances.slice(0, k);
    
    // Вычисляем вероятность как долю одобренных среди k ближайших
    const approvedCount = kNearest.filter(d => d.status === 1).length;
    return approvedCount / k;
}

// Обновление предсказания для ручных данных
export function updatePrediction() {
    if (!state.customerData || state.customerData.length === 0) return;
    
    // Получаем текущие параметры займа
    const loanTypeSelect = document.getElementById('loan-type');
    const loanIntentSelect = document.getElementById('loan-intent');
    const loanAmountInput = document.getElementById('loan-amount-input');
    
    if (loanTypeSelect && loanIntentSelect && loanAmountInput) {
        state.loanParameters.productType = loanTypeSelect.value;
        state.loanParameters.loanIntent = loanIntentSelect.value;
        state.loanParameters.loanAmount = parseFloat(loanAmountInput.value) || 50000;
    }
    
    const probability = predictLoanApproval(state.values, state.loanParameters);
    const percentage = Math.round(probability * 100);
    
    // Обновляем значение вероятности
    const probabilityValue = document.getElementById('probability-value');
    if (probabilityValue) {
        probabilityValue.textContent = `${percentage}%`;
    }
    
    // Обновляем прогресс-бар
    const probabilityBar = document.getElementById('probability-bar');
    if (probabilityBar) {
        probabilityBar.style.width = `${percentage}%`;
    }
    
    // Обновляем статус
    const predictionStatus = document.getElementById('prediction-status');
    if (predictionStatus) {
        predictionStatus.className = 'prediction-status';
        if (probability >= 0.5) {
            predictionStatus.classList.add('approved');
            predictionStatus.textContent = '✓ Likely to be APPROVED';
        } else {
            predictionStatus.classList.add('rejected');
            predictionStatus.textContent = '✗ Likely to be REJECTED';
        }
    }
}

// Инициализация параметров займа
export function initializeLoanParameters() {
    const loanTypeSelect = document.getElementById('loan-type');
    const loanIntentSelect = document.getElementById('loan-intent');
    const loanAmountInput = document.getElementById('loan-amount-input');
    
    if (loanTypeSelect) {
        loanTypeSelect.value = state.loanParameters.productType;
        loanTypeSelect.addEventListener('change', function() {
            state.loanParameters.productType = this.value;
            updatePrediction();
        });
    }
    
    if (loanIntentSelect) {
        loanIntentSelect.value = state.loanParameters.loanIntent;
        loanIntentSelect.addEventListener('change', function() {
            state.loanParameters.loanIntent = this.value;
            updatePrediction();
        });
    }
    
    if (loanAmountInput) {
        loanAmountInput.value = state.loanParameters.loanAmount;
        loanAmountInput.addEventListener('input', function() {
            const value = parseFloat(this.value) || 0;
            state.loanParameters.loanAmount = value;
            updatePrediction();
        });
        
        loanAmountInput.addEventListener('blur', function() {
            const value = parseFloat(this.value) || 50000;
            state.loanParameters.loanAmount = value;
            this.value = value;
            updatePrediction();
        });
    }
}

