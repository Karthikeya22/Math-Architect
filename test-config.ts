async function test() {
  const res = await fetch("http://localhost:3000/api/config");
  const text = await res.text();
  console.log("Config response length:", text.length);
  console.log("Config content:", text);
}
test();
