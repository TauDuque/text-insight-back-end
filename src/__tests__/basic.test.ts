// Teste básico para verificar se o Jest está funcionando
describe("Basic Test Suite", () => {
  it("should pass a simple test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle strings correctly", () => {
    expect("hello").toBe("hello");
  });

  it("should work with arrays", () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });
});
