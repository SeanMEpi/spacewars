describe("index.js", function() {
  describe("Ship functions", function() {
    it ("creates a ship object", function() {
      ship1 = new Ship();
      expect(ship1.x).toEqual(0);
    });
    it ("absolute position of ship can be directly set", function() {
      ship1 = new Ship();
      ship1.setPosition(.200, .200);
      expect(ship1.x).toEqual(.200);
      expect(ship1.y).toEqual(.200);
    });
    it("vectors can be added", function() {
      ship1 = new Ship();
      ship1.addVector(Math.PI, .002);
      ship1.addVector((3 * Math.PI) / 2, .001);
      ship1.addVector((3 * Math.PI) / 2, .001);
      expect(ship1.vector).toEqual([-.002, -.002]);
    });
    it("tracks position based on vector state", function() {
      ship1 = new Ship();
      ship1.setPosition(.200, .200);
      ship1.addVector((3 * Math.PI) / 2, .001);
      ship1.newPosition();
      expect(ship1.x).toEqual(.200);
      expect(ship1.y).toEqual(.199);
      ship1.newPosition();
      expect(ship1.x).toEqual(.200);
      expect(ship1.y).toEqual(.198);
      ship1.addVector(Math.PI / 2, .001);
      ship1.newPosition();
      expect(ship1.x).toEqual(.200);
      expect(ship1.y).toEqual(.198);
    });
  });
});

