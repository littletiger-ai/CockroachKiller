export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

export function degToRad(deg) {
    return deg * Math.PI / 180;
}

export function getDistance(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}
