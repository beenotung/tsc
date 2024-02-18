var g = 'g'

function f1() {}
/1/g

var f2 = function f2() {}
/1/g

var a = {}
/1/g

console.log({f1})
console.log({f2})
console.log({a})
