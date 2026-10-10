export const EXAMPLES = {
javascript: {
 "Hello World": 'console.log("Hello, Coding Gen!");',
 "Variables & types": 'const n = 42, s = "text", b = true, x = null;\nconsole.log(typeof n, typeof s, typeof b, typeof x, typeof undefined);',
 "Conditions & loops": 'for (let i = 1; i <= 5; i++) {\n  console.log(i % 2 === 0 ? i + " even" : i + " odd");\n}',
 "Functions": 'const fact = n => n <= 1 ? 1 : n * fact(n - 1);\nconsole.log(fact(10));',
 "Arrays": 'const a = [3, 1, 2];\nconsole.log(a.map(x => x * 2), a.filter(x => x > 1), a.reduce((p, c) => p + c, 0));',
 "Objects": 'const p = { name: "Ada", langs: ["JS", "Py"] };\nconsole.log(p, Object.keys(p));',
 "Sorting": 'console.log([5, 2, 9, 1].sort((a, b) => a - b));',
 "Searching": 'const a = [1, 3, 5, 7, 9];\nlet lo = 0, hi = a.length - 1, t = 7;\nwhile (lo <= hi) {\n  const m = (lo + hi) >> 1;\n  if (a[m] === t) { console.log("found at", m); break; }\n  a[m] < t ? lo = m + 1 : hi = m - 1;\n}',
 "Read input": 'const a = Number(readLine()), b = Number(readLine());\nconsole.log(a + b);  // put two lines in the Input panel'
},
python: {
 "Hello World": 'print("Hello, Coding Gen!")',
 "Variables & input": 'name = input("Name: ")\nprint("Hello", name)',
 "Conditions": 'n = int(input())\nprint("even" if n % 2 == 0 else "odd")',
 "Loops": 'for i in range(1, 6):\n    print(i, i * i)',
 "Functions": 'def greet(n):\n    return f"Hi {n}"\nprint(greet("Ada"))',
 "Lists & dicts": 'd = {"a": 1, "b": 2}\nl = [x * 2 for x in d.values()]\nprint(d, l)',
 "Factorial": 'import math\nprint(math.factorial(10))',
 "Fibonacci": 'a, b = 0, 1\nfor _ in range(10):\n    print(a, end=" ")\n    a, b = b, a + b\nprint()',
 "Searching & sorting": 'l = [5, 2, 9, 1]\nl.sort()\nprint(l, 9 in l, l.index(9))'
}};
export const TEMPLATE = { javascript: EXAMPLES.javascript["Hello World"], python: EXAMPLES.python["Hello World"] };
