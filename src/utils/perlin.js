class Perlin {
  p = new Array(512);
  //生成哈希表
  getPermutation() {
    let permutation = new Array(256);
    for (let i = 0; i < 256; i++) {
      permutation[i] = i;
    }
    for (let i = 0; i < 256; i++) {
      let r = Math.floor(Math.random() * (256 - i));
      let temp = permutation[i];
      permutation[i] = permutation[r];
      permutation[r] = temp;
    }
    this.p = [...permutation, ...permutation];
  }
  //缓和曲线函数
  static fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  //直接计算点积的函数
  static dot2d(hash, x, y) {
    switch (hash & 3) {
      case 0:
        return x + y;
      case 1:
        return -x + y;
      case 2:
        return x - y;
      case 3:
        return -x - y;
      default:
        return 0;
    }
  }
  static dot3d(hash, x, y, z) {
    switch (hash & 7) {
      case 0:
        return x + y;
      case 1:
        return -x + y;
      case 2:
        return x - y;
      case 3:
        return -x - y;
      case 4:
        return x + z;
      case 5:
        return -x + z;
      case 6:
        return x - z;
      case 7:
        return -x - z;
      default:
        return 0;
    }
  }
  //插值函数
  static lerp(a, b, t) {
    return (1 - t) * a + t * b;
  }

  //计算2d柏林噪声
  cal2d(x, y) {
    //晶格左下角顶点坐标
    let xn = Math.floor(x);
    let yn = Math.floor(y);
    //点在晶格内的坐标
    let xf = x - xn;
    let yf = y - yn;
    //缓和曲线计算权重
    let u = Perlin.fade(xf);
    let v = Perlin.fade(yf);
    //防止溢出255
    xn = xn & 255;
    yn = yn & 255;
    //计算哈希值
    let n00 = this.p[this.p[xn] + yn];
    let n01 = this.p[this.p[xn] + yn + 1];
    let n10 = this.p[this.p[xn + 1] + yn];
    let n11 = this.p[this.p[xn + 1] + yn + 1];
    //计算点积并插值
    //左下、右下
    let v1 = Perlin.lerp(Perlin.dot2d(n00, xf, yf), Perlin.dot2d(n10, xf - 1, yf), u);
    //左上、右上
    let v2 = Perlin.lerp(Perlin.dot2d(n01, xf, yf - 1), Perlin.dot2d(n11, xf - 1, yf - 1), u);
    let u1 = Perlin.lerp(v1, v2, v);
    return u1;
  }
  //计算3d柏林噪声
  cal3d(x, y, z) {
    //晶格左下角顶点坐标
    let xn = Math.floor(x);
    let yn = Math.floor(y);
    let zn = Math.floor(z);
    //点在晶格内的坐标
    let xf = x - xn;
    let yf = y - yn;
    let zf = z - zn;
    //缓和曲线计算权重
    let u = Perlin.fade(xf);
    let v = Perlin.fade(yf);
    let w = Perlin.fade(zf);
    //防止溢出255
    xn = xn & 255;
    yn = yn & 255;
    zn = zn & 255;
    //计算哈希值
    let n000 = this.p[this.p[this.p[xn] + yn] + zn];
    let n001 = this.p[this.p[this.p[xn] + yn] + zn + 1];
    let n010 = this.p[this.p[this.p[xn] + yn + 1] + zn];
    let n011 = this.p[this.p[this.p[xn] + yn + 1] + zn + 1];
    let n100 = this.p[this.p[this.p[xn + 1] + yn] + zn];
    let n101 = this.p[this.p[this.p[xn + 1] + yn] + zn + 1];
    let n110 = this.p[this.p[this.p[xn + 1] + yn + 1] + zn];
    let n111 = this.p[this.p[this.p[xn + 1] + yn + 1] + zn + 1];
    //计算点积并插值
    let v1 = Perlin.lerp(Perlin.dot3d(n000, xf, yf, zf), Perlin.dot3d(n100, xf - 1, yf, zf), u);
    let v2 = Perlin.lerp(Perlin.dot3d(n010, xf, yf - 1, zf), Perlin.dot3d(n110, xf - 1, yf - 1, zf), u);
    let v3 = Perlin.lerp(Perlin.dot3d(n001, xf, yf, zf - 1), Perlin.dot3d(n101, xf - 1, yf, zf - 1), u);
    let v4 = Perlin.lerp(Perlin.dot3d(n011, xf, yf - 1, zf - 1), Perlin.dot3d(n111, xf - 1, yf - 1, zf - 1), u);
    let w1 = Perlin.lerp(v1, v2, v);
    let w2 = Perlin.lerp(v3, v4, v);
    let u1 = Perlin.lerp(w1, w2, w);
    return u1;

  }
  //FBM函数
  fbm3d(x, y, z,
    octaves,//倍频，叠加次数
    lacunarity,//频率变化率
    gain,//振幅变化率
    frequency=1,//初始频率
    amplitude=1,//初始振幅
    ) {
    let sum = 0;
    for (let i = 0; i < octaves; i++) {
      sum += this.cal3d(x * frequency, y * frequency, z * frequency) * amplitude;
      frequency *= lacunarity;
      amplitude *= gain;
    }
    return sum/amplitude/(Math.floor(octaves)+1);
  };

  constructor() {
    this.getPermutation();
  }
}
export { Perlin };