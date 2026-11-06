module.exports = {
  NextResponse: class NextResponse {
    constructor(body, init = {}) {
      this.status = (init && init.status) || 200;
      this.headers = new Map();
      if (typeof body === 'string') { this.body = body; } else { this.body = JSON.stringify(body); }
    }
    static json(data, init) { return new NextResponse(JSON.stringify(data), init); }
    async json() { return JSON.parse(this.body); }
    async text() { return this.body; }
  }
};
