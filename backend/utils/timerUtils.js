// utils/timerUtils.js
exports.calculateTimeRemaining = (endDate) => {
    if (!endDate) return null;

    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;

    if (diff <= 0) {
        return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
        expired: false,
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
    };
};

exports.formatTimeRemaining = (timeRemaining) => {
    if (!timeRemaining || timeRemaining.expired) {
        return 'Expired';
    }

    const { days, hours, minutes, seconds } = timeRemaining;

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else {
        return `${minutes}m ${seconds}s`;
    }
};