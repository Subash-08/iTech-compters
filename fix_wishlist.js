const fs = require('fs');
const path = 'c:/Users/Dell/Desktop/itech-gst-before/backend/controllers/wishlistController.js';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/select: 'name([^']+)'/g, (match, p1) => {
    if (!p1.includes('taxRate')) {
        return "select: 'name" + p1 + " taxRate'";
    }
    return match;
});
fs.writeFileSync(path, content, 'utf8');
console.log('Done');
