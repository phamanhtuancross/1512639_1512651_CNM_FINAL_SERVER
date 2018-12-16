const transaction = require('./index');
const base32 = require('base32.js');

console.log('hello this is my test case');
var temp = transaction.decode(Buffer.from('ATA8i2kusx/LGR5eAZ/7L2FhJIL8wtK3QdYou1L0XkGbXSLfAAAAAAAAAAMPU2Vjb25kIHRyYW5zZmVyAgArMB3E9jeB6Vq5oRwzKMwi5omyIV71sg7mRlMKKXqNwzMkDCgAAAAXSHboAFKd3raEBbfuD4RrZWOwSmzcHURUhIQdS3g4bUE+V9XajtCVt/1ucI8XZyUfXc64AOcaOG2/L+eCUgTxaARAhA8=','base64'));

console.log(temp);
console.log(base32.decode(temp.params.address));



