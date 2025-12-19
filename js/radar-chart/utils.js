import { axes } from './config.js';

// Нормализация данных для модели
export function normalizeValue(value, min, max) {
    if (max === min) return 0;
    return (value - min) / (max - min);
}

// Вычисление евклидова расстояния между двумя точками
export function euclideanDistance(point1, point2) {
    let sum = 0;
    for (let i = 0; i < point1.length; i++) {
        sum += Math.pow(point1[i] - point2[i], 2);
    }
    return Math.sqrt(sum);
}

// Функция для применения ограничений и округления значения
export function constrainAndRound(value, axisIndex) {
    const axis = axes[axisIndex];
    
    // Применяем ограничения
    value = Math.max(axis.min, Math.min(axis.max, value));
    
    // Округляем согласно типу
    if (axisIndex === 1 || axisIndex === 2 || axisIndex === 4) { // Income, Debt, Savings
        value = Math.round(value / 1000) * 1000;
    } else if (axisIndex === 3) { // Years
        value = Math.round(value * 2) / 2;
    } else {
        value = Math.round(value);
    }
    
    return value;
}

// Форматирование значения для отображения
export function formatValue(value, axisIndex) {
    if (axisIndex === 1 || axisIndex === 2 || axisIndex === 4) { // Income, Debt, Savings
        return '$' + value.toLocaleString();
    } else if (axisIndex === 3) { // Years
        return value.toFixed(1);
    } else if (axisIndex === 5) { // DTI Ratio
        return value.toFixed(1) + '%';
    } else {
        return value.toString();
    }
}

