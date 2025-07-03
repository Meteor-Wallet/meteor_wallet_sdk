(() => {
  var __webpack_modules__ = {
      84322: (t, e, r) => {
        t.exports = r(35666);
      },
      58162: (t, e, r) => {
        var n = r(89509).Buffer;
        t.exports = function (t) {
          if (t.length >= 255) throw new TypeError("Alphabet too long");
          for (var e = new Uint8Array(256), r = 0; r < e.length; r++) e[r] = 255;
          for (var i = 0; i < t.length; i++) {
            var o = t.charAt(i),
              s = o.charCodeAt(0);
            if (255 !== e[s]) throw new TypeError(o + " is ambiguous");
            e[s] = i;
          }
          var a = t.length,
            c = t.charAt(0),
            u = Math.log(a) / Math.log(256),
            h = Math.log(256) / Math.log(a);

          function l(t) {
            if ("string" != typeof t) throw new TypeError("Expected String");
            if (0 === t.length) return n.alloc(0);
            var r = 0;
            if (" " !== t[r]) {
              for (var i = 0, o = 0; t[r] === c; ) i++, r++;
              for (var s = ((t.length - r) * u + 1) >>> 0, h = new Uint8Array(s); t[r]; ) {
                var l = e[t.charCodeAt(r)];
                if (255 === l) return;
                for (var f = 0, d = s - 1; (0 !== l || f < o) && -1 !== d; d--, f++)
                  (l += (a * h[d]) >>> 0), (h[d] = (l % 256) >>> 0), (l = (l / 256) >>> 0);
                if (0 !== l) throw new Error("Non-zero carry");
                (o = f), r++;
              }
              if (" " !== t[r]) {
                for (var p = s - o; p !== s && 0 === h[p]; ) p++;
                var y = n.allocUnsafe(i + (s - p));
                y.fill(0, 0, i);
                for (var m = i; p !== s; ) y[m++] = h[p++];
                return y;
              }
            }
          }
          return {
            encode: function (e) {
              if (
                ((Array.isArray(e) || e instanceof Uint8Array) && (e = n.from(e)), !n.isBuffer(e))
              )
                throw new TypeError("Expected Buffer");
              if (0 === e.length) return "";
              for (var r = 0, i = 0, o = 0, s = e.length; o !== s && 0 === e[o]; ) o++, r++;
              for (var u = ((s - o) * h + 1) >>> 0, l = new Uint8Array(u); o !== s; ) {
                for (var f = e[o], d = 0, p = u - 1; (0 !== f || d < i) && -1 !== p; p--, d++)
                  (f += (256 * l[p]) >>> 0), (l[p] = (f % a) >>> 0), (f = (f / a) >>> 0);
                if (0 !== f) throw new Error("Non-zero carry");
                (i = d), o++;
              }
              for (var y = u - i; y !== u && 0 === l[y]; ) y++;
              for (var m = c.repeat(r); y < u; ++y) m += t.charAt(l[y]);
              return m;
            },
            decodeUnsafe: l,
            decode: function (t) {
              var e = l(t);
              if (e) return e;
              throw new Error("Non-base" + a + " character");
            },
          };
        };
      },
      79742: (t, e) => {
        (e.byteLength = function (t) {
          var e = c(t),
            r = e[0],
            n = e[1];
          return (3 * (r + n)) / 4 - n;
        }),
          (e.toByteArray = function (t) {
            var e,
              r,
              o = c(t),
              s = o[0],
              a = o[1],
              u = new i(
                (function (t, e, r) {
                  return (3 * (e + r)) / 4 - r;
                })(0, s, a),
              ),
              h = 0,
              l = a > 0 ? s - 4 : s;
            for (r = 0; r < l; r += 4)
              (e =
                (n[t.charCodeAt(r)] << 18) |
                (n[t.charCodeAt(r + 1)] << 12) |
                (n[t.charCodeAt(r + 2)] << 6) |
                n[t.charCodeAt(r + 3)]),
                (u[h++] = (e >> 16) & 255),
                (u[h++] = (e >> 8) & 255),
                (u[h++] = 255 & e);
            2 === a &&
              ((e = (n[t.charCodeAt(r)] << 2) | (n[t.charCodeAt(r + 1)] >> 4)), (u[h++] = 255 & e));
            1 === a &&
              ((e =
                (n[t.charCodeAt(r)] << 10) |
                (n[t.charCodeAt(r + 1)] << 4) |
                (n[t.charCodeAt(r + 2)] >> 2)),
              (u[h++] = (e >> 8) & 255),
              (u[h++] = 255 & e));
            return u;
          }),
          (e.fromByteArray = function (t) {
            for (var e, n = t.length, i = n % 3, o = [], s = 16383, a = 0, c = n - i; a < c; a += s)
              o.push(u(t, a, a + s > c ? c : a + s));
            1 === i
              ? ((e = t[n - 1]), o.push(r[e >> 2] + r[(e << 4) & 63] + "=="))
              : 2 === i &&
                ((e = (t[n - 2] << 8) + t[n - 1]),
                o.push(r[e >> 10] + r[(e >> 4) & 63] + r[(e << 2) & 63] + "="));
            return o.join("");
          });
        for (
          var r = [],
            n = [],
            i = "undefined" != typeof Uint8Array ? Uint8Array : Array,
            o = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
            s = 0,
            a = o.length;
          s < a;
          ++s
        )
          (r[s] = o[s]), (n[o.charCodeAt(s)] = s);

        function c(t) {
          var e = t.length;
          if (e % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
          var r = t.indexOf("=");
          return -1 === r && (r = e), [r, r === e ? 0 : 4 - (r % 4)];
        }

        function u(t, e, n) {
          for (var i, o, s = [], a = e; a < n; a += 3)
            (i = ((t[a] << 16) & 16711680) + ((t[a + 1] << 8) & 65280) + (255 & t[a + 2])),
              s.push(r[((o = i) >> 18) & 63] + r[(o >> 12) & 63] + r[(o >> 6) & 63] + r[63 & o]);
          return s.join("");
        }
        (n["-".charCodeAt(0)] = 62), (n["_".charCodeAt(0)] = 63);
      },
      13550: function (t, e, r) {
        !(function (t, e) {
          function n(t, e) {
            if (!t) throw new Error(e || "Assertion failed");
          }

          function i(t, e) {
            t.super_ = e;
            var r = function () {};
            (r.prototype = e.prototype), (t.prototype = new r()), (t.prototype.constructor = t);
          }

          function o(t, e, r) {
            if (o.isBN(t)) return t;
            (this.negative = 0),
              (this.words = null),
              (this.length = 0),
              (this.red = null),
              null !== t &&
                (("le" !== e && "be" !== e) || ((r = e), (e = 10)),
                this._init(t || 0, e || 10, r || "be"));
          }
          var s;
          "object" == typeof t ? (t.exports = o) : (e.BN = o), (o.BN = o), (o.wordSize = 26);
          try {
            s =
              "undefined" != typeof window && void 0 !== window.Buffer
                ? window.Buffer
                : r(46601).Buffer;
          } catch (t) {}

          function a(t, e) {
            var r = t.charCodeAt(e);
            return r >= 48 && r <= 57
              ? r - 48
              : r >= 65 && r <= 70
                ? r - 55
                : r >= 97 && r <= 102
                  ? r - 87
                  : void n(!1, "Invalid character in " + t);
          }

          function c(t, e, r) {
            var n = a(t, r);
            return r - 1 >= e && (n |= a(t, r - 1) << 4), n;
          }

          function u(t, e, r, i) {
            for (var o = 0, s = 0, a = Math.min(t.length, r), c = e; c < a; c++) {
              var u = t.charCodeAt(c) - 48;
              (o *= i),
                (s = u >= 49 ? u - 49 + 10 : u >= 17 ? u - 17 + 10 : u),
                n(u >= 0 && s < i, "Invalid character"),
                (o += s);
            }
            return o;
          }

          function h(t, e) {
            (t.words = e.words), (t.length = e.length), (t.negative = e.negative), (t.red = e.red);
          }
          if (
            ((o.isBN = function (t) {
              return (
                t instanceof o ||
                (null !== t &&
                  "object" == typeof t &&
                  t.constructor.wordSize === o.wordSize &&
                  Array.isArray(t.words))
              );
            }),
            (o.max = function (t, e) {
              return t.cmp(e) > 0 ? t : e;
            }),
            (o.min = function (t, e) {
              return t.cmp(e) < 0 ? t : e;
            }),
            (o.prototype._init = function (t, e, r) {
              if ("number" == typeof t) return this._initNumber(t, e, r);
              if ("object" == typeof t) return this._initArray(t, e, r);
              "hex" === e && (e = 16), n(e === (0 | e) && e >= 2 && e <= 36);
              var i = 0;
              "-" === (t = t.toString().replace(/\s+/g, ""))[0] && (i++, (this.negative = 1)),
                i < t.length &&
                  (16 === e
                    ? this._parseHex(t, i, r)
                    : (this._parseBase(t, e, i),
                      "le" === r && this._initArray(this.toArray(), e, r)));
            }),
            (o.prototype._initNumber = function (t, e, r) {
              t < 0 && ((this.negative = 1), (t = -t)),
                t < 67108864
                  ? ((this.words = [67108863 & t]), (this.length = 1))
                  : t < 4503599627370496
                    ? ((this.words = [67108863 & t, (t / 67108864) & 67108863]), (this.length = 2))
                    : (n(t < 9007199254740992),
                      (this.words = [67108863 & t, (t / 67108864) & 67108863, 1]),
                      (this.length = 3)),
                "le" === r && this._initArray(this.toArray(), e, r);
            }),
            (o.prototype._initArray = function (t, e, r) {
              if ((n("number" == typeof t.length), t.length <= 0))
                return (this.words = [0]), (this.length = 1), this;
              (this.length = Math.ceil(t.length / 3)), (this.words = new Array(this.length));
              for (var i = 0; i < this.length; i++) this.words[i] = 0;
              var o,
                s,
                a = 0;
              if ("be" === r)
                for (i = t.length - 1, o = 0; i >= 0; i -= 3)
                  (s = t[i] | (t[i - 1] << 8) | (t[i - 2] << 16)),
                    (this.words[o] |= (s << a) & 67108863),
                    (this.words[o + 1] = (s >>> (26 - a)) & 67108863),
                    (a += 24) >= 26 && ((a -= 26), o++);
              else if ("le" === r)
                for (i = 0, o = 0; i < t.length; i += 3)
                  (s = t[i] | (t[i + 1] << 8) | (t[i + 2] << 16)),
                    (this.words[o] |= (s << a) & 67108863),
                    (this.words[o + 1] = (s >>> (26 - a)) & 67108863),
                    (a += 24) >= 26 && ((a -= 26), o++);
              return this._strip();
            }),
            (o.prototype._parseHex = function (t, e, r) {
              (this.length = Math.ceil((t.length - e) / 6)), (this.words = new Array(this.length));
              for (var n = 0; n < this.length; n++) this.words[n] = 0;
              var i,
                o = 0,
                s = 0;
              if ("be" === r)
                for (n = t.length - 1; n >= e; n -= 2)
                  (i = c(t, e, n) << o),
                    (this.words[s] |= 67108863 & i),
                    o >= 18 ? ((o -= 18), (s += 1), (this.words[s] |= i >>> 26)) : (o += 8);
              else
                for (n = (t.length - e) % 2 == 0 ? e + 1 : e; n < t.length; n += 2)
                  (i = c(t, e, n) << o),
                    (this.words[s] |= 67108863 & i),
                    o >= 18 ? ((o -= 18), (s += 1), (this.words[s] |= i >>> 26)) : (o += 8);
              this._strip();
            }),
            (o.prototype._parseBase = function (t, e, r) {
              (this.words = [0]), (this.length = 1);
              for (var n = 0, i = 1; i <= 67108863; i *= e) n++;
              n--, (i = (i / e) | 0);
              for (
                var o = t.length - r, s = o % n, a = Math.min(o, o - s) + r, c = 0, h = r;
                h < a;
                h += n
              )
                (c = u(t, h, h + n, e)),
                  this.imuln(i),
                  this.words[0] + c < 67108864 ? (this.words[0] += c) : this._iaddn(c);
              if (0 !== s) {
                var l = 1;
                for (c = u(t, h, t.length, e), h = 0; h < s; h++) l *= e;
                this.imuln(l), this.words[0] + c < 67108864 ? (this.words[0] += c) : this._iaddn(c);
              }
              this._strip();
            }),
            (o.prototype.copy = function (t) {
              t.words = new Array(this.length);
              for (var e = 0; e < this.length; e++) t.words[e] = this.words[e];
              (t.length = this.length), (t.negative = this.negative), (t.red = this.red);
            }),
            (o.prototype._move = function (t) {
              h(t, this);
            }),
            (o.prototype.clone = function () {
              var t = new o(null);
              return this.copy(t), t;
            }),
            (o.prototype._expand = function (t) {
              while (this.length < t) this.words[this.length++] = 0;
              return this;
            }),
            (o.prototype._strip = function () {
              while (this.length > 1 && 0 === this.words[this.length - 1]) this.length--;
              return this._normSign();
            }),
            (o.prototype._normSign = function () {
              return 1 === this.length && 0 === this.words[0] && (this.negative = 0), this;
            }),
            "undefined" != typeof Symbol && "function" == typeof Symbol.for)
          )
            try {
              o.prototype[Symbol.for("nodejs.util.inspect.custom")] = l;
            } catch (t) {
              o.prototype.inspect = l;
            }
          else o.prototype.inspect = l;

          function l() {
            return (this.red ? "<BN-R: " : "<BN: ") + this.toString(16) + ">";
          }
          var f = [
              "",
              "0",
              "00",
              "000",
              "0000",
              "00000",
              "000000",
              "0000000",
              "00000000",
              "000000000",
              "0000000000",
              "00000000000",
              "000000000000",
              "0000000000000",
              "00000000000000",
              "000000000000000",
              "0000000000000000",
              "00000000000000000",
              "000000000000000000",
              "0000000000000000000",
              "00000000000000000000",
              "000000000000000000000",
              "0000000000000000000000",
              "00000000000000000000000",
              "000000000000000000000000",
              "0000000000000000000000000",
            ],
            d = [
              0, 0, 25, 16, 12, 11, 10, 9, 8, 8, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5,
              5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
            ],
            p = [
              0, 0, 33554432, 43046721, 16777216, 48828125, 60466176, 40353607, 16777216, 43046721,
              1e7, 19487171, 35831808, 62748517, 7529536, 11390625, 16777216, 24137569, 34012224,
              47045881, 64e6, 4084101, 5153632, 6436343, 7962624, 9765625, 11881376, 14348907,
              17210368, 20511149, 243e5, 28629151, 33554432, 39135393, 45435424, 52521875, 60466176,
            ];
          (o.prototype.toString = function (t, e) {
            var r;
            if (((e = 0 | e || 1), 16 === (t = t || 10) || "hex" === t)) {
              r = "";
              for (var i = 0, o = 0, s = 0; s < this.length; s++) {
                var a = this.words[s],
                  c = (16777215 & ((a << i) | o)).toString(16);
                (r =
                  0 !== (o = (a >>> (24 - i)) & 16777215) || s !== this.length - 1
                    ? f[6 - c.length] + c + r
                    : c + r),
                  (i += 2) >= 26 && ((i -= 26), s--);
              }
              for (0 !== o && (r = o.toString(16) + r); r.length % e != 0; ) r = "0" + r;
              return 0 !== this.negative && (r = "-" + r), r;
            }
            if (t === (0 | t) && t >= 2 && t <= 36) {
              var u = d[t],
                h = p[t];
              r = "";
              var l = this.clone();
              for (l.negative = 0; !l.isZero(); ) {
                var y = l.modrn(h).toString(t);
                r = (l = l.idivn(h)).isZero() ? y + r : f[u - y.length] + y + r;
              }
              for (this.isZero() && (r = "0" + r); r.length % e != 0; ) r = "0" + r;
              return 0 !== this.negative && (r = "-" + r), r;
            }
            n(!1, "Base should be between 2 and 36");
          }),
            (o.prototype.toNumber = function () {
              var t = this.words[0];
              return (
                2 === this.length
                  ? (t += 67108864 * this.words[1])
                  : 3 === this.length && 1 === this.words[2]
                    ? (t += 4503599627370496 + 67108864 * this.words[1])
                    : this.length > 2 && n(!1, "Number can only safely store up to 53 bits"),
                0 !== this.negative ? -t : t
              );
            }),
            (o.prototype.toJSON = function () {
              return this.toString(16, 2);
            }),
            s &&
              (o.prototype.toBuffer = function (t, e) {
                return this.toArrayLike(s, t, e);
              }),
            (o.prototype.toArray = function (t, e) {
              return this.toArrayLike(Array, t, e);
            });

          function y(t, e, r) {
            r.negative = e.negative ^ t.negative;
            var n = (t.length + e.length) | 0;
            (r.length = n), (n = (n - 1) | 0);
            var i = 0 | t.words[0],
              o = 0 | e.words[0],
              s = i * o,
              a = 67108863 & s,
              c = (s / 67108864) | 0;
            r.words[0] = a;
            for (var u = 1; u < n; u++) {
              for (
                var h = c >>> 26,
                  l = 67108863 & c,
                  f = Math.min(u, e.length - 1),
                  d = Math.max(0, u - t.length + 1);
                d <= f;
                d++
              ) {
                var p = (u - d) | 0;
                (h += ((s = (i = 0 | t.words[p]) * (o = 0 | e.words[d]) + l) / 67108864) | 0),
                  (l = 67108863 & s);
              }
              (r.words[u] = 0 | l), (c = 0 | h);
            }
            return 0 !== c ? (r.words[u] = 0 | c) : r.length--, r._strip();
          }
          (o.prototype.toArrayLike = function (t, e, r) {
            this._strip();
            var i = this.byteLength(),
              o = r || Math.max(1, i);
            n(i <= o, "byte array longer than desired length"),
              n(o > 0, "Requested array length <= 0");
            var s = (function (t, e) {
              return t.allocUnsafe ? t.allocUnsafe(e) : new t(e);
            })(t, o);
            return this["_toArrayLike" + ("le" === e ? "LE" : "BE")](s, i), s;
          }),
            (o.prototype._toArrayLikeLE = function (t, e) {
              for (var r = 0, n = 0, i = 0, o = 0; i < this.length; i++) {
                var s = (this.words[i] << o) | n;
                (t[r++] = 255 & s),
                  r < t.length && (t[r++] = (s >> 8) & 255),
                  r < t.length && (t[r++] = (s >> 16) & 255),
                  6 === o
                    ? (r < t.length && (t[r++] = (s >> 24) & 255), (n = 0), (o = 0))
                    : ((n = s >>> 24), (o += 2));
              }
              if (r < t.length) for (t[r++] = n; r < t.length; ) t[r++] = 0;
            }),
            (o.prototype._toArrayLikeBE = function (t, e) {
              for (var r = t.length - 1, n = 0, i = 0, o = 0; i < this.length; i++) {
                var s = (this.words[i] << o) | n;
                (t[r--] = 255 & s),
                  r >= 0 && (t[r--] = (s >> 8) & 255),
                  r >= 0 && (t[r--] = (s >> 16) & 255),
                  6 === o
                    ? (r >= 0 && (t[r--] = (s >> 24) & 255), (n = 0), (o = 0))
                    : ((n = s >>> 24), (o += 2));
              }
              if (r >= 0) for (t[r--] = n; r >= 0; ) t[r--] = 0;
            }),
            Math.clz32
              ? (o.prototype._countBits = function (t) {
                  return 32 - Math.clz32(t);
                })
              : (o.prototype._countBits = function (t) {
                  var e = t,
                    r = 0;
                  return (
                    e >= 4096 && ((r += 13), (e >>>= 13)),
                    e >= 64 && ((r += 7), (e >>>= 7)),
                    e >= 8 && ((r += 4), (e >>>= 4)),
                    e >= 2 && ((r += 2), (e >>>= 2)),
                    r + e
                  );
                }),
            (o.prototype._zeroBits = function (t) {
              if (0 === t) return 26;
              var e = t,
                r = 0;
              return (
                0 == (8191 & e) && ((r += 13), (e >>>= 13)),
                0 == (127 & e) && ((r += 7), (e >>>= 7)),
                0 == (15 & e) && ((r += 4), (e >>>= 4)),
                0 == (3 & e) && ((r += 2), (e >>>= 2)),
                0 == (1 & e) && r++,
                r
              );
            }),
            (o.prototype.bitLength = function () {
              var t = this.words[this.length - 1],
                e = this._countBits(t);
              return 26 * (this.length - 1) + e;
            }),
            (o.prototype.zeroBits = function () {
              if (this.isZero()) return 0;
              for (var t = 0, e = 0; e < this.length; e++) {
                var r = this._zeroBits(this.words[e]);
                if (((t += r), 26 !== r)) break;
              }
              return t;
            }),
            (o.prototype.byteLength = function () {
              return Math.ceil(this.bitLength() / 8);
            }),
            (o.prototype.toTwos = function (t) {
              return 0 !== this.negative ? this.abs().inotn(t).iaddn(1) : this.clone();
            }),
            (o.prototype.fromTwos = function (t) {
              return this.testn(t - 1) ? this.notn(t).iaddn(1).ineg() : this.clone();
            }),
            (o.prototype.isNeg = function () {
              return 0 !== this.negative;
            }),
            (o.prototype.neg = function () {
              return this.clone().ineg();
            }),
            (o.prototype.ineg = function () {
              return this.isZero() || (this.negative ^= 1), this;
            }),
            (o.prototype.iuor = function (t) {
              while (this.length < t.length) this.words[this.length++] = 0;
              for (var e = 0; e < t.length; e++) this.words[e] = this.words[e] | t.words[e];
              return this._strip();
            }),
            (o.prototype.ior = function (t) {
              return n(0 == (this.negative | t.negative)), this.iuor(t);
            }),
            (o.prototype.or = function (t) {
              return this.length > t.length ? this.clone().ior(t) : t.clone().ior(this);
            }),
            (o.prototype.uor = function (t) {
              return this.length > t.length ? this.clone().iuor(t) : t.clone().iuor(this);
            }),
            (o.prototype.iuand = function (t) {
              var e;
              e = this.length > t.length ? t : this;
              for (var r = 0; r < e.length; r++) this.words[r] = this.words[r] & t.words[r];
              return (this.length = e.length), this._strip();
            }),
            (o.prototype.iand = function (t) {
              return n(0 == (this.negative | t.negative)), this.iuand(t);
            }),
            (o.prototype.and = function (t) {
              return this.length > t.length ? this.clone().iand(t) : t.clone().iand(this);
            }),
            (o.prototype.uand = function (t) {
              return this.length > t.length ? this.clone().iuand(t) : t.clone().iuand(this);
            }),
            (o.prototype.iuxor = function (t) {
              var e, r;
              this.length > t.length ? ((e = this), (r = t)) : ((e = t), (r = this));
              for (var n = 0; n < r.length; n++) this.words[n] = e.words[n] ^ r.words[n];
              if (this !== e) for (; n < e.length; n++) this.words[n] = e.words[n];
              return (this.length = e.length), this._strip();
            }),
            (o.prototype.ixor = function (t) {
              return n(0 == (this.negative | t.negative)), this.iuxor(t);
            }),
            (o.prototype.xor = function (t) {
              return this.length > t.length ? this.clone().ixor(t) : t.clone().ixor(this);
            }),
            (o.prototype.uxor = function (t) {
              return this.length > t.length ? this.clone().iuxor(t) : t.clone().iuxor(this);
            }),
            (o.prototype.inotn = function (t) {
              n("number" == typeof t && t >= 0);
              var e = 0 | Math.ceil(t / 26),
                r = t % 26;
              this._expand(e), r > 0 && e--;
              for (var i = 0; i < e; i++) this.words[i] = 67108863 & ~this.words[i];
              return (
                r > 0 && (this.words[i] = ~this.words[i] & (67108863 >> (26 - r))), this._strip()
              );
            }),
            (o.prototype.notn = function (t) {
              return this.clone().inotn(t);
            }),
            (o.prototype.setn = function (t, e) {
              n("number" == typeof t && t >= 0);
              var r = (t / 26) | 0,
                i = t % 26;
              return (
                this._expand(r + 1),
                (this.words[r] = e ? this.words[r] | (1 << i) : this.words[r] & ~(1 << i)),
                this._strip()
              );
            }),
            (o.prototype.iadd = function (t) {
              var e, r, n;
              if (0 !== this.negative && 0 === t.negative)
                return (
                  (this.negative = 0), (e = this.isub(t)), (this.negative ^= 1), this._normSign()
                );
              if (0 === this.negative && 0 !== t.negative)
                return (t.negative = 0), (e = this.isub(t)), (t.negative = 1), e._normSign();
              this.length > t.length ? ((r = this), (n = t)) : ((r = t), (n = this));
              for (var i = 0, o = 0; o < n.length; o++)
                (e = (0 | r.words[o]) + (0 | n.words[o]) + i),
                  (this.words[o] = 67108863 & e),
                  (i = e >>> 26);
              for (; 0 !== i && o < r.length; o++)
                (e = (0 | r.words[o]) + i), (this.words[o] = 67108863 & e), (i = e >>> 26);
              if (((this.length = r.length), 0 !== i)) (this.words[this.length] = i), this.length++;
              else if (r !== this) for (; o < r.length; o++) this.words[o] = r.words[o];
              return this;
            }),
            (o.prototype.add = function (t) {
              var e;
              return 0 !== t.negative && 0 === this.negative
                ? ((t.negative = 0), (e = this.sub(t)), (t.negative ^= 1), e)
                : 0 === t.negative && 0 !== this.negative
                  ? ((this.negative = 0), (e = t.sub(this)), (this.negative = 1), e)
                  : this.length > t.length
                    ? this.clone().iadd(t)
                    : t.clone().iadd(this);
            }),
            (o.prototype.isub = function (t) {
              if (0 !== t.negative) {
                t.negative = 0;
                var e = this.iadd(t);
                return (t.negative = 1), e._normSign();
              }
              if (0 !== this.negative)
                return (this.negative = 0), this.iadd(t), (this.negative = 1), this._normSign();
              var r,
                n,
                i = this.cmp(t);
              if (0 === i) return (this.negative = 0), (this.length = 1), (this.words[0] = 0), this;
              i > 0 ? ((r = this), (n = t)) : ((r = t), (n = this));
              for (var o = 0, s = 0; s < n.length; s++)
                (o = (e = (0 | r.words[s]) - (0 | n.words[s]) + o) >> 26),
                  (this.words[s] = 67108863 & e);
              for (; 0 !== o && s < r.length; s++)
                (o = (e = (0 | r.words[s]) + o) >> 26), (this.words[s] = 67108863 & e);
              if (0 === o && s < r.length && r !== this)
                for (; s < r.length; s++) this.words[s] = r.words[s];
              return (
                (this.length = Math.max(this.length, s)),
                r !== this && (this.negative = 1),
                this._strip()
              );
            }),
            (o.prototype.sub = function (t) {
              return this.clone().isub(t);
            });
          var m = function (t, e, r) {
            var n,
              i,
              o,
              s = t.words,
              a = e.words,
              c = r.words,
              u = 0,
              h = 0 | s[0],
              l = 8191 & h,
              f = h >>> 13,
              d = 0 | s[1],
              p = 8191 & d,
              y = d >>> 13,
              m = 0 | s[2],
              g = 8191 & m,
              w = m >>> 13,
              v = 0 | s[3],
              b = 8191 & v,
              _ = v >>> 13,
              E = 0 | s[4],
              A = 8191 & E,
              M = E >>> 13,
              S = 0 | s[5],
              I = 8191 & S,
              k = S >>> 13,
              x = 0 | s[6],
              T = 8191 & x,
              O = x >>> 13,
              C = 0 | s[7],
              R = 8191 & C,
              P = C >>> 13,
              N = 0 | s[8],
              U = 8191 & N,
              B = N >>> 13,
              K = 0 | s[9],
              L = 8191 & K,
              j = K >>> 13,
              F = 0 | a[0],
              D = 8191 & F,
              H = F >>> 13,
              q = 0 | a[1],
              $ = 8191 & q,
              z = q >>> 13,
              G = 0 | a[2],
              X = 8191 & G,
              W = G >>> 13,
              J = 0 | a[3],
              V = 8191 & J,
              Y = J >>> 13,
              Z = 0 | a[4],
              Q = 8191 & Z,
              tt = Z >>> 13,
              et = 0 | a[5],
              rt = 8191 & et,
              nt = et >>> 13,
              it = 0 | a[6],
              ot = 8191 & it,
              st = it >>> 13,
              at = 0 | a[7],
              ct = 8191 & at,
              ut = at >>> 13,
              ht = 0 | a[8],
              lt = 8191 & ht,
              ft = ht >>> 13,
              dt = 0 | a[9],
              pt = 8191 & dt,
              yt = dt >>> 13;
            (r.negative = t.negative ^ e.negative), (r.length = 19);
            var mt =
              (((u + (n = Math.imul(l, D))) | 0) +
                ((8191 & (i = ((i = Math.imul(l, H)) + Math.imul(f, D)) | 0)) << 13)) |
              0;
            (u = ((((o = Math.imul(f, H)) + (i >>> 13)) | 0) + (mt >>> 26)) | 0),
              (mt &= 67108863),
              (n = Math.imul(p, D)),
              (i = ((i = Math.imul(p, H)) + Math.imul(y, D)) | 0),
              (o = Math.imul(y, H));
            var gt =
              (((u + (n = (n + Math.imul(l, $)) | 0)) | 0) +
                ((8191 & (i = ((i = (i + Math.imul(l, z)) | 0) + Math.imul(f, $)) | 0)) << 13)) |
              0;
            (u = ((((o = (o + Math.imul(f, z)) | 0) + (i >>> 13)) | 0) + (gt >>> 26)) | 0),
              (gt &= 67108863),
              (n = Math.imul(g, D)),
              (i = ((i = Math.imul(g, H)) + Math.imul(w, D)) | 0),
              (o = Math.imul(w, H)),
              (n = (n + Math.imul(p, $)) | 0),
              (i = ((i = (i + Math.imul(p, z)) | 0) + Math.imul(y, $)) | 0),
              (o = (o + Math.imul(y, z)) | 0);
            var wt =
              (((u + (n = (n + Math.imul(l, X)) | 0)) | 0) +
                ((8191 & (i = ((i = (i + Math.imul(l, W)) | 0) + Math.imul(f, X)) | 0)) << 13)) |
              0;
            (u = ((((o = (o + Math.imul(f, W)) | 0) + (i >>> 13)) | 0) + (wt >>> 26)) | 0),
              (wt &= 67108863),
              (n = Math.imul(b, D)),
              (i = ((i = Math.imul(b, H)) + Math.imul(_, D)) | 0),
              (o = Math.imul(_, H)),
              (n = (n + Math.imul(g, $)) | 0),
              (i = ((i = (i + Math.imul(g, z)) | 0) + Math.imul(w, $)) | 0),
              (o = (o + Math.imul(w, z)) | 0),
              (n = (n + Math.imul(p, X)) | 0),
              (i = ((i = (i + Math.imul(p, W)) | 0) + Math.imul(y, X)) | 0),
              (o = (o + Math.imul(y, W)) | 0);
            var vt =
              (((u + (n = (n + Math.imul(l, V)) | 0)) | 0) +
                ((8191 & (i = ((i = (i + Math.imul(l, Y)) | 0) + Math.imul(f, V)) | 0)) << 13)) |
              0;
            (u = ((((o = (o + Math.imul(f, Y)) | 0) + (i >>> 13)) | 0) + (vt >>> 26)) | 0),
              (vt &= 67108863),
              (n = Math.imul(A, D)),
              (i = ((i = Math.imul(A, H)) + Math.imul(M, D)) | 0),
              (o = Math.imul(M, H)),
              (n = (n + Math.imul(b, $)) | 0),
              (i = ((i = (i + Math.imul(b, z)) | 0) + Math.imul(_, $)) | 0),
              (o = (o + Math.imul(_, z)) | 0),
              (n = (n + Math.imul(g, X)) | 0),
              (i = ((i = (i + Math.imul(g, W)) | 0) + Math.imul(w, X)) | 0),
              (o = (o + Math.imul(w, W)) | 0),
              (n = (n + Math.imul(p, V)) | 0),
              (i = ((i = (i + Math.imul(p, Y)) | 0) + Math.imul(y, V)) | 0),
              (o = (o + Math.imul(y, Y)) | 0);
            var bt =
              (((u + (n = (n + Math.imul(l, Q)) | 0)) | 0) +
                ((8191 & (i = ((i = (i + Math.imul(l, tt)) | 0) + Math.imul(f, Q)) | 0)) << 13)) |
              0;
            (u = ((((o = (o + Math.imul(f, tt)) | 0) + (i >>> 13)) | 0) + (bt >>> 26)) | 0),
              (bt &= 67108863),
              (n = Math.imul(I, D)),
              (i = ((i = Math.imul(I, H)) + Math.imul(k, D)) | 0),
              (o = Math.imul(k, H)),
              (n = (n + Math.imul(A, $)) | 0),
              (i = ((i = (i + Math.imul(A, z)) | 0) + Math.imul(M, $)) | 0),
              (o = (o + Math.imul(M, z)) | 0),
              (n = (n + Math.imul(b, X)) | 0),
              (i = ((i = (i + Math.imul(b, W)) | 0) + Math.imul(_, X)) | 0),
              (o = (o + Math.imul(_, W)) | 0),
              (n = (n + Math.imul(g, V)) | 0),
              (i = ((i = (i + Math.imul(g, Y)) | 0) + Math.imul(w, V)) | 0),
              (o = (o + Math.imul(w, Y)) | 0),
              (n = (n + Math.imul(p, Q)) | 0),
              (i = ((i = (i + Math.imul(p, tt)) | 0) + Math.imul(y, Q)) | 0),
              (o = (o + Math.imul(y, tt)) | 0);
            var _t =
              (((u + (n = (n + Math.imul(l, rt)) | 0)) | 0) +
                ((8191 & (i = ((i = (i + Math.imul(l, nt)) | 0) + Math.imul(f, rt)) | 0)) << 13)) |
              0;
            (u = ((((o = (o + Math.imul(f, nt)) | 0) + (i >>> 13)) | 0) + (_t >>> 26)) | 0),
              (_t &= 67108863),
              (n = Math.imul(T, D)),
              (i = ((i = Math.imul(T, H)) + Math.imul(O, D)) | 0),
              (o = Math.imul(O, H)),
              (n = (n + Math.imul(I, $)) | 0),
              (i = ((i = (i + Math.imul(I, z)) | 0) + Math.imul(k, $)) | 0),
              (o = (o + Math.imul(k, z)) | 0),
              (n = (n + Math.imul(A, X)) | 0),
              (i = ((i = (i + Math.imul(A, W)) | 0) + Math.imul(M, X)) | 0),
              (o = (o + Math.imul(M, W)) | 0),
              (n = (n + Math.imul(b, V)) | 0),
              (i = ((i = (i + Math.imul(b, Y)) | 0) + Math.imul(_, V)) | 0),
              (o = (o + Math.imul(_, Y)) | 0),
              (n = (n + Math.imul(g, Q)) | 0),
              (i = ((i = (i + Math.imul(g, tt)) | 0) + Math.imul(w, Q)) | 0),
              (o = (o + Math.imul(w, tt)) | 0),
              (n = (n + Math.imul(p, rt)) | 0),
              (i = ((i = (i + Math.imul(p, nt)) | 0) + Math.imul(y, rt)) | 0),
              (o = (o + Math.imul(y, nt)) | 0);
            var Et =
              (((u + (n = (n + Math.imul(l, ot)) | 0)) | 0) +
                ((8191 & (i = ((i = (i + Math.imul(l, st)) | 0) + Math.imul(f, ot)) | 0)) << 13)) |
              0;
            (u = ((((o = (o + Math.imul(f, st)) | 0) + (i >>> 13)) | 0) + (Et >>> 26)) | 0),
              (Et &= 67108863),
              (n = Math.imul(R, D)),
              (i = ((i = Math.imul(R, H)) + Math.imul(P, D)) | 0),
              (o = Math.imul(P, H)),
              (n = (n + Math.imul(T, $)) | 0),
              (i = ((i = (i + Math.imul(T, z)) | 0) + Math.imul(O, $)) | 0),
              (o = (o + Math.imul(O, z)) | 0),
              (n = (n + Math.imul(I, X)) | 0),
              (i = ((i = (i + Math.imul(I, W)) | 0) + Math.imul(k, X)) | 0),
              (o = (o + Math.imul(k, W)) | 0),
              (n = (n + Math.imul(A, V)) | 0),
              (i = ((i = (i + Math.imul(A, Y)) | 0) + Math.imul(M, V)) | 0),
              (o = (o + Math.imul(M, Y)) | 0),
              (n = (n + Math.imul(b, Q)) | 0),
              (i = ((i = (i + Math.imul(b, tt)) | 0) + Math.imul(_, Q)) | 0),
              (o = (o + Math.imul(_, tt)) | 0),
              (n = (n + Math.imul(g, rt)) | 0),
              (i = ((i = (i + Math.imul(g, nt)) | 0) + Math.imul(w, rt)) | 0),
              (o = (o + Math.imul(w, nt)) | 0),
              (n = (n + Math.imul(p, ot)) | 0),
              (i = ((i = (i + Math.imul(p, st)) | 0) + Math.imul(y, ot)) | 0),
              (o = (o + Math.imul(y, st)) | 0);
            var At =
              (((u + (n = (n + Math.imul(l, ct)) | 0)) | 0) +
                ((8191 & (i = ((i = (i + Math.imul(l, ut)) | 0) + Math.imul(f, ct)) | 0)) << 13)) |
              0;
            (u = ((((o = (o + Math.imul(f, ut)) | 0) + (i >>> 13)) | 0) + (At >>> 26)) | 0),
              (At &= 67108863),
              (n = Math.imul(U, D)),
              (i = ((i = Math.imul(U, H)) + Math.imul(B, D)) | 0),
              (o = Math.imul(B, H)),
              (n = (n + Math.imul(R, $)) | 0),
              (i = ((i = (i + Math.imul(R, z)) | 0) + Math.imul(P, $)) | 0),
              (o = (o + Math.imul(P, z)) | 0),
              (n = (n + Math.imul(T, X)) | 0),
              (i = ((i = (i + Math.imul(T, W)) | 0) + Math.imul(O, X)) | 0),
              (o = (o + Math.imul(O, W)) | 0),
              (n = (n + Math.imul(I, V)) | 0),
              (i = ((i = (i + Math.imul(I, Y)) | 0) + Math.imul(k, V)) | 0),
              (o = (o + Math.imul(k, Y)) | 0),
              (n = (n + Math.imul(A, Q)) | 0),
              (i = ((i = (i + Math.imul(A, tt)) | 0) + Math.imul(M, Q)) | 0),
              (o = (o + Math.imul(M, tt)) | 0),
              (n = (n + Math.imul(b, rt)) | 0),
              (i = ((i = (i + Math.imul(b, nt)) | 0) + Math.imul(_, rt)) | 0),
              (o = (o + Math.imul(_, nt)) | 0),
              (n = (n + Math.imul(g, ot)) | 0),
              (i = ((i = (i + Math.imul(g, st)) | 0) + Math.imul(w, ot)) | 0),
              (o = (o + Math.imul(w, st)) | 0),
              (n = (n + Math.imul(p, ct)) | 0),
              (i = ((i = (i + Math.imul(p, ut)) | 0) + Math.imul(y, ct)) | 0),
              (o = (o + Math.imul(y, ut)) | 0);
            var Mt =
              (((u + (n = (n + Math.imul(l, lt)) | 0)) | 0) +
                ((8191 & (i = ((i = (i + Math.imul(l, ft)) | 0) + Math.imul(f, lt)) | 0)) << 13)) |
              0;
            (u = ((((o = (o + Math.imul(f, ft)) | 0) + (i >>> 13)) | 0) + (Mt >>> 26)) | 0),
              (Mt &= 67108863),
              (n = Math.imul(L, D)),
              (i = ((i = Math.imul(L, H)) + Math.imul(j, D)) | 0),
              (o = Math.imul(j, H)),
              (n = (n + Math.imul(U, $)) | 0),
              (i = ((i = (i + Math.imul(U, z)) | 0) + Math.imul(B, $)) | 0),
              (o = (o + Math.imul(B, z)) | 0),
              (n = (n + Math.imul(R, X)) | 0),
              (i = ((i = (i + Math.imul(R, W)) | 0) + Math.imul(P, X)) | 0),
              (o = (o + Math.imul(P, W)) | 0),
              (n = (n + Math.imul(T, V)) | 0),
              (i = ((i = (i + Math.imul(T, Y)) | 0) + Math.imul(O, V)) | 0),
              (o = (o + Math.imul(O, Y)) | 0),
              (n = (n + Math.imul(I, Q)) | 0),
              (i = ((i = (i + Math.imul(I, tt)) | 0) + Math.imul(k, Q)) | 0),
              (o = (o + Math.imul(k, tt)) | 0),
              (n = (n + Math.imul(A, rt)) | 0),
              (i = ((i = (i + Math.imul(A, nt)) | 0) + Math.imul(M, rt)) | 0),
              (o = (o + Math.imul(M, nt)) | 0),
              (n = (n + Math.imul(b, ot)) | 0),
              (i = ((i = (i + Math.imul(b, st)) | 0) + Math.imul(_, ot)) | 0),
              (o = (o + Math.imul(_, st)) | 0),
              (n = (n + Math.imul(g, ct)) | 0),
              (i = ((i = (i + Math.imul(g, ut)) | 0) + Math.imul(w, ct)) | 0),
              (o = (o + Math.imul(w, ut)) | 0),
              (n = (n + Math.imul(p, lt)) | 0),
              (i = ((i = (i + Math.imul(p, ft)) | 0) + Math.imul(y, lt)) | 0),
              (o = (o + Math.imul(y, ft)) | 0);
            var St =
              (((u + (n = (n + Math.imul(l, pt)) | 0)) | 0) +
                ((8191 & (i = ((i = (i + Math.imul(l, yt)) | 0) + Math.imul(f, pt)) | 0)) << 13)) |
              0;
            (u = ((((o = (o + Math.imul(f, yt)) | 0) + (i >>> 13)) | 0) + (St >>> 26)) | 0),
              (St &= 67108863),
              (n = Math.imul(L, $)),
              (i = ((i = Math.imul(L, z)) + Math.imul(j, $)) | 0),
              (o = Math.imul(j, z)),
              (n = (n + Math.imul(U, X)) | 0),
              (i = ((i = (i + Math.imul(U, W)) | 0) + Math.imul(B, X)) | 0),
              (o = (o + Math.imul(B, W)) | 0),
              (n = (n + Math.imul(R, V)) | 0),
              (i = ((i = (i + Math.imul(R, Y)) | 0) + Math.imul(P, V)) | 0),
              (o = (o + Math.imul(P, Y)) | 0),
              (n = (n + Math.imul(T, Q)) | 0),
              (i = ((i = (i + Math.imul(T, tt)) | 0) + Math.imul(O, Q)) | 0),
              (o = (o + Math.imul(O, tt)) | 0),
              (n = (n + Math.imul(I, rt)) | 0),
              (i = ((i = (i + Math.imul(I, nt)) | 0) + Math.imul(k, rt)) | 0),
              (o = (o + Math.imul(k, nt)) | 0),
              (n = (n + Math.imul(A, ot)) | 0),
              (i = ((i = (i + Math.imul(A, st)) | 0) + Math.imul(M, ot)) | 0),
              (o = (o + Math.imul(M, st)) | 0),
              (n = (n + Math.imul(b, ct)) | 0),
              (i = ((i = (i + Math.imul(b, ut)) | 0) + Math.imul(_, ct)) | 0),
              (o = (o + Math.imul(_, ut)) | 0),
              (n = (n + Math.imul(g, lt)) | 0),
              (i = ((i = (i + Math.imul(g, ft)) | 0) + Math.imul(w, lt)) | 0),
              (o = (o + Math.imul(w, ft)) | 0);
            var It =
              (((u + (n = (n + Math.imul(p, pt)) | 0)) | 0) +
                ((8191 & (i = ((i = (i + Math.imul(p, yt)) | 0) + Math.imul(y, pt)) | 0)) << 13)) |
              0;
            (u = ((((o = (o + Math.imul(y, yt)) | 0) + (i >>> 13)) | 0) + (It >>> 26)) | 0),
              (It &= 67108863),
              (n = Math.imul(L, X)),
              (i = ((i = Math.imul(L, W)) + Math.imul(j, X)) | 0),
              (o = Math.imul(j, W)),
              (n = (n + Math.imul(U, V)) | 0),
              (i = ((i = (i + Math.imul(U, Y)) | 0) + Math.imul(B, V)) | 0),
              (o = (o + Math.imul(B, Y)) | 0),
              (n = (n + Math.imul(R, Q)) | 0),
              (i = ((i = (i + Math.imul(R, tt)) | 0) + Math.imul(P, Q)) | 0),
              (o = (o + Math.imul(P, tt)) | 0),
              (n = (n + Math.imul(T, rt)) | 0),
              (i = ((i = (i + Math.imul(T, nt)) | 0) + Math.imul(O, rt)) | 0),
              (o = (o + Math.imul(O, nt)) | 0),
              (n = (n + Math.imul(I, ot)) | 0),
              (i = ((i = (i + Math.imul(I, st)) | 0) + Math.imul(k, ot)) | 0),
              (o = (o + Math.imul(k, st)) | 0),
              (n = (n + Math.imul(A, ct)) | 0),
              (i = ((i = (i + Math.imul(A, ut)) | 0) + Math.imul(M, ct)) | 0),
              (o = (o + Math.imul(M, ut)) | 0),
              (n = (n + Math.imul(b, lt)) | 0),
              (i = ((i = (i + Math.imul(b, ft)) | 0) + Math.imul(_, lt)) | 0),
              (o = (o + Math.imul(_, ft)) | 0);
            var kt =
              (((u + (n = (n + Math.imul(g, pt)) | 0)) | 0) +
                ((8191 & (i = ((i = (i + Math.imul(g, yt)) | 0) + Math.imul(w, pt)) | 0)) << 13)) |
              0;
            (u = ((((o = (o + Math.imul(w, yt)) | 0) + (i >>> 13)) | 0) + (kt >>> 26)) | 0),
              (kt &= 67108863),
              (n = Math.imul(L, V)),
              (i = ((i = Math.imul(L, Y)) + Math.imul(j, V)) | 0),
              (o = Math.imul(j, Y)),
              (n = (n + Math.imul(U, Q)) | 0),
              (i = ((i = (i + Math.imul(U, tt)) | 0) + Math.imul(B, Q)) | 0),
              (o = (o + Math.imul(B, tt)) | 0),
              (n = (n + Math.imul(R, rt)) | 0),
              (i = ((i = (i + Math.imul(R, nt)) | 0) + Math.imul(P, rt)) | 0),
              (o = (o + Math.imul(P, nt)) | 0),
              (n = (n + Math.imul(T, ot)) | 0),
              (i = ((i = (i + Math.imul(T, st)) | 0) + Math.imul(O, ot)) | 0),
              (o = (o + Math.imul(O, st)) | 0),
              (n = (n + Math.imul(I, ct)) | 0),
              (i = ((i = (i + Math.imul(I, ut)) | 0) + Math.imul(k, ct)) | 0),
              (o = (o + Math.imul(k, ut)) | 0),
              (n = (n + Math.imul(A, lt)) | 0),
              (i = ((i = (i + Math.imul(A, ft)) | 0) + Math.imul(M, lt)) | 0),
              (o = (o + Math.imul(M, ft)) | 0);
            var xt =
              (((u + (n = (n + Math.imul(b, pt)) | 0)) | 0) +
                ((8191 & (i = ((i = (i + Math.imul(b, yt)) | 0) + Math.imul(_, pt)) | 0)) << 13)) |
              0;
            (u = ((((o = (o + Math.imul(_, yt)) | 0) + (i >>> 13)) | 0) + (xt >>> 26)) | 0),
              (xt &= 67108863),
              (n = Math.imul(L, Q)),
              (i = ((i = Math.imul(L, tt)) + Math.imul(j, Q)) | 0),
              (o = Math.imul(j, tt)),
              (n = (n + Math.imul(U, rt)) | 0),
              (i = ((i = (i + Math.imul(U, nt)) | 0) + Math.imul(B, rt)) | 0),
              (o = (o + Math.imul(B, nt)) | 0),
              (n = (n + Math.imul(R, ot)) | 0),
              (i = ((i = (i + Math.imul(R, st)) | 0) + Math.imul(P, ot)) | 0),
              (o = (o + Math.imul(P, st)) | 0),
              (n = (n + Math.imul(T, ct)) | 0),
              (i = ((i = (i + Math.imul(T, ut)) | 0) + Math.imul(O, ct)) | 0),
              (o = (o + Math.imul(O, ut)) | 0),
              (n = (n + Math.imul(I, lt)) | 0),
              (i = ((i = (i + Math.imul(I, ft)) | 0) + Math.imul(k, lt)) | 0),
              (o = (o + Math.imul(k, ft)) | 0);
            var Tt =
              (((u + (n = (n + Math.imul(A, pt)) | 0)) | 0) +
                ((8191 & (i = ((i = (i + Math.imul(A, yt)) | 0) + Math.imul(M, pt)) | 0)) << 13)) |
              0;
            (u = ((((o = (o + Math.imul(M, yt)) | 0) + (i >>> 13)) | 0) + (Tt >>> 26)) | 0),
              (Tt &= 67108863),
              (n = Math.imul(L, rt)),
              (i = ((i = Math.imul(L, nt)) + Math.imul(j, rt)) | 0),
              (o = Math.imul(j, nt)),
              (n = (n + Math.imul(U, ot)) | 0),
              (i = ((i = (i + Math.imul(U, st)) | 0) + Math.imul(B, ot)) | 0),
              (o = (o + Math.imul(B, st)) | 0),
              (n = (n + Math.imul(R, ct)) | 0),
              (i = ((i = (i + Math.imul(R, ut)) | 0) + Math.imul(P, ct)) | 0),
              (o = (o + Math.imul(P, ut)) | 0),
              (n = (n + Math.imul(T, lt)) | 0),
              (i = ((i = (i + Math.imul(T, ft)) | 0) + Math.imul(O, lt)) | 0),
              (o = (o + Math.imul(O, ft)) | 0);
            var Ot =
              (((u + (n = (n + Math.imul(I, pt)) | 0)) | 0) +
                ((8191 & (i = ((i = (i + Math.imul(I, yt)) | 0) + Math.imul(k, pt)) | 0)) << 13)) |
              0;
            (u = ((((o = (o + Math.imul(k, yt)) | 0) + (i >>> 13)) | 0) + (Ot >>> 26)) | 0),
              (Ot &= 67108863),
              (n = Math.imul(L, ot)),
              (i = ((i = Math.imul(L, st)) + Math.imul(j, ot)) | 0),
              (o = Math.imul(j, st)),
              (n = (n + Math.imul(U, ct)) | 0),
              (i = ((i = (i + Math.imul(U, ut)) | 0) + Math.imul(B, ct)) | 0),
              (o = (o + Math.imul(B, ut)) | 0),
              (n = (n + Math.imul(R, lt)) | 0),
              (i = ((i = (i + Math.imul(R, ft)) | 0) + Math.imul(P, lt)) | 0),
              (o = (o + Math.imul(P, ft)) | 0);
            var Ct =
              (((u + (n = (n + Math.imul(T, pt)) | 0)) | 0) +
                ((8191 & (i = ((i = (i + Math.imul(T, yt)) | 0) + Math.imul(O, pt)) | 0)) << 13)) |
              0;
            (u = ((((o = (o + Math.imul(O, yt)) | 0) + (i >>> 13)) | 0) + (Ct >>> 26)) | 0),
              (Ct &= 67108863),
              (n = Math.imul(L, ct)),
              (i = ((i = Math.imul(L, ut)) + Math.imul(j, ct)) | 0),
              (o = Math.imul(j, ut)),
              (n = (n + Math.imul(U, lt)) | 0),
              (i = ((i = (i + Math.imul(U, ft)) | 0) + Math.imul(B, lt)) | 0),
              (o = (o + Math.imul(B, ft)) | 0);
            var Rt =
              (((u + (n = (n + Math.imul(R, pt)) | 0)) | 0) +
                ((8191 & (i = ((i = (i + Math.imul(R, yt)) | 0) + Math.imul(P, pt)) | 0)) << 13)) |
              0;
            (u = ((((o = (o + Math.imul(P, yt)) | 0) + (i >>> 13)) | 0) + (Rt >>> 26)) | 0),
              (Rt &= 67108863),
              (n = Math.imul(L, lt)),
              (i = ((i = Math.imul(L, ft)) + Math.imul(j, lt)) | 0),
              (o = Math.imul(j, ft));
            var Pt =
              (((u + (n = (n + Math.imul(U, pt)) | 0)) | 0) +
                ((8191 & (i = ((i = (i + Math.imul(U, yt)) | 0) + Math.imul(B, pt)) | 0)) << 13)) |
              0;
            (u = ((((o = (o + Math.imul(B, yt)) | 0) + (i >>> 13)) | 0) + (Pt >>> 26)) | 0),
              (Pt &= 67108863);
            var Nt =
              (((u + (n = Math.imul(L, pt))) | 0) +
                ((8191 & (i = ((i = Math.imul(L, yt)) + Math.imul(j, pt)) | 0)) << 13)) |
              0;
            return (
              (u = ((((o = Math.imul(j, yt)) + (i >>> 13)) | 0) + (Nt >>> 26)) | 0),
              (Nt &= 67108863),
              (c[0] = mt),
              (c[1] = gt),
              (c[2] = wt),
              (c[3] = vt),
              (c[4] = bt),
              (c[5] = _t),
              (c[6] = Et),
              (c[7] = At),
              (c[8] = Mt),
              (c[9] = St),
              (c[10] = It),
              (c[11] = kt),
              (c[12] = xt),
              (c[13] = Tt),
              (c[14] = Ot),
              (c[15] = Ct),
              (c[16] = Rt),
              (c[17] = Pt),
              (c[18] = Nt),
              0 !== u && ((c[19] = u), r.length++),
              r
            );
          };

          function g(t, e, r) {
            (r.negative = e.negative ^ t.negative), (r.length = t.length + e.length);
            for (var n = 0, i = 0, o = 0; o < r.length - 1; o++) {
              var s = i;
              i = 0;
              for (
                var a = 67108863 & n,
                  c = Math.min(o, e.length - 1),
                  u = Math.max(0, o - t.length + 1);
                u <= c;
                u++
              ) {
                var h = o - u,
                  l = (0 | t.words[h]) * (0 | e.words[u]),
                  f = 67108863 & l;
                (a = 67108863 & (f = (f + a) | 0)),
                  (i += (s = ((s = (s + ((l / 67108864) | 0)) | 0) + (f >>> 26)) | 0) >>> 26),
                  (s &= 67108863);
              }
              (r.words[o] = a), (n = s), (s = i);
            }
            return 0 !== n ? (r.words[o] = n) : r.length--, r._strip();
          }

          function w(t, e, r) {
            return g(t, e, r);
          }

          function v(t, e) {
            (this.x = t), (this.y = e);
          }
          Math.imul || (m = y),
            (o.prototype.mulTo = function (t, e) {
              var r = this.length + t.length;
              return 10 === this.length && 10 === t.length
                ? m(this, t, e)
                : r < 63
                  ? y(this, t, e)
                  : r < 1024
                    ? g(this, t, e)
                    : w(this, t, e);
            }),
            (v.prototype.makeRBT = function (t) {
              for (var e = new Array(t), r = o.prototype._countBits(t) - 1, n = 0; n < t; n++)
                e[n] = this.revBin(n, r, t);
              return e;
            }),
            (v.prototype.revBin = function (t, e, r) {
              if (0 === t || t === r - 1) return t;
              for (var n = 0, i = 0; i < e; i++) (n |= (1 & t) << (e - i - 1)), (t >>= 1);
              return n;
            }),
            (v.prototype.permute = function (t, e, r, n, i, o) {
              for (var s = 0; s < o; s++) (n[s] = e[t[s]]), (i[s] = r[t[s]]);
            }),
            (v.prototype.transform = function (t, e, r, n, i, o) {
              this.permute(o, t, e, r, n, i);
              for (var s = 1; s < i; s <<= 1)
                for (
                  var a = s << 1,
                    c = Math.cos((2 * Math.PI) / a),
                    u = Math.sin((2 * Math.PI) / a),
                    h = 0;
                  h < i;
                  h += a
                )
                  for (var l = c, f = u, d = 0; d < s; d++) {
                    var p = r[h + d],
                      y = n[h + d],
                      m = r[h + d + s],
                      g = n[h + d + s],
                      w = l * m - f * g;
                    (g = l * g + f * m),
                      (m = w),
                      (r[h + d] = p + m),
                      (n[h + d] = y + g),
                      (r[h + d + s] = p - m),
                      (n[h + d + s] = y - g),
                      d !== a && ((w = c * l - u * f), (f = c * f + u * l), (l = w));
                  }
            }),
            (v.prototype.guessLen13b = function (t, e) {
              var r = 1 | Math.max(e, t),
                n = 1 & r,
                i = 0;
              for (r = (r / 2) | 0; r; r >>>= 1) i++;
              return 1 << (i + 1 + n);
            }),
            (v.prototype.conjugate = function (t, e, r) {
              if (!(r <= 1))
                for (var n = 0; n < r / 2; n++) {
                  var i = t[n];
                  (t[n] = t[r - n - 1]),
                    (t[r - n - 1] = i),
                    (i = e[n]),
                    (e[n] = -e[r - n - 1]),
                    (e[r - n - 1] = -i);
                }
            }),
            (v.prototype.normalize13b = function (t, e) {
              for (var r = 0, n = 0; n < e / 2; n++) {
                var i = 8192 * Math.round(t[2 * n + 1] / e) + Math.round(t[2 * n] / e) + r;
                (t[n] = 67108863 & i), (r = i < 67108864 ? 0 : (i / 67108864) | 0);
              }
              return t;
            }),
            (v.prototype.convert13b = function (t, e, r, i) {
              for (var o = 0, s = 0; s < e; s++)
                (o += 0 | t[s]),
                  (r[2 * s] = 8191 & o),
                  (o >>>= 13),
                  (r[2 * s + 1] = 8191 & o),
                  (o >>>= 13);
              for (s = 2 * e; s < i; ++s) r[s] = 0;
              n(0 === o), n(0 == (-8192 & o));
            }),
            (v.prototype.stub = function (t) {
              for (var e = new Array(t), r = 0; r < t; r++) e[r] = 0;
              return e;
            }),
            (v.prototype.mulp = function (t, e, r) {
              var n = 2 * this.guessLen13b(t.length, e.length),
                i = this.makeRBT(n),
                o = this.stub(n),
                s = new Array(n),
                a = new Array(n),
                c = new Array(n),
                u = new Array(n),
                h = new Array(n),
                l = new Array(n),
                f = r.words;
              (f.length = n),
                this.convert13b(t.words, t.length, s, n),
                this.convert13b(e.words, e.length, u, n),
                this.transform(s, o, a, c, n, i),
                this.transform(u, o, h, l, n, i);
              for (var d = 0; d < n; d++) {
                var p = a[d] * h[d] - c[d] * l[d];
                (c[d] = a[d] * l[d] + c[d] * h[d]), (a[d] = p);
              }
              return (
                this.conjugate(a, c, n),
                this.transform(a, c, f, o, n, i),
                this.conjugate(f, o, n),
                this.normalize13b(f, n),
                (r.negative = t.negative ^ e.negative),
                (r.length = t.length + e.length),
                r._strip()
              );
            }),
            (o.prototype.mul = function (t) {
              var e = new o(null);
              return (e.words = new Array(this.length + t.length)), this.mulTo(t, e);
            }),
            (o.prototype.mulf = function (t) {
              var e = new o(null);
              return (e.words = new Array(this.length + t.length)), w(this, t, e);
            }),
            (o.prototype.imul = function (t) {
              return this.clone().mulTo(t, this);
            }),
            (o.prototype.imuln = function (t) {
              var e = t < 0;
              e && (t = -t), n("number" == typeof t), n(t < 67108864);
              for (var r = 0, i = 0; i < this.length; i++) {
                var o = (0 | this.words[i]) * t,
                  s = (67108863 & o) + (67108863 & r);
                (r >>= 26),
                  (r += (o / 67108864) | 0),
                  (r += s >>> 26),
                  (this.words[i] = 67108863 & s);
              }
              return 0 !== r && ((this.words[i] = r), this.length++), e ? this.ineg() : this;
            }),
            (o.prototype.muln = function (t) {
              return this.clone().imuln(t);
            }),
            (o.prototype.sqr = function () {
              return this.mul(this);
            }),
            (o.prototype.isqr = function () {
              return this.imul(this.clone());
            }),
            (o.prototype.pow = function (t) {
              var e = (function (t) {
                for (var e = new Array(t.bitLength()), r = 0; r < e.length; r++) {
                  var n = (r / 26) | 0,
                    i = r % 26;
                  e[r] = (t.words[n] >>> i) & 1;
                }
                return e;
              })(t);
              if (0 === e.length) return new o(1);
              for (var r = this, n = 0; n < e.length && 0 === e[n]; n++, r = r.sqr());
              if (++n < e.length)
                for (var i = r.sqr(); n < e.length; n++, i = i.sqr()) 0 !== e[n] && (r = r.mul(i));
              return r;
            }),
            (o.prototype.iushln = function (t) {
              n("number" == typeof t && t >= 0);
              var e,
                r = t % 26,
                i = (t - r) / 26,
                o = (67108863 >>> (26 - r)) << (26 - r);
              if (0 !== r) {
                var s = 0;
                for (e = 0; e < this.length; e++) {
                  var a = this.words[e] & o,
                    c = ((0 | this.words[e]) - a) << r;
                  (this.words[e] = c | s), (s = a >>> (26 - r));
                }
                s && ((this.words[e] = s), this.length++);
              }
              if (0 !== i) {
                for (e = this.length - 1; e >= 0; e--) this.words[e + i] = this.words[e];
                for (e = 0; e < i; e++) this.words[e] = 0;
                this.length += i;
              }
              return this._strip();
            }),
            (o.prototype.ishln = function (t) {
              return n(0 === this.negative), this.iushln(t);
            }),
            (o.prototype.iushrn = function (t, e, r) {
              var i;
              n("number" == typeof t && t >= 0), (i = e ? (e - (e % 26)) / 26 : 0);
              var o = t % 26,
                s = Math.min((t - o) / 26, this.length),
                a = 67108863 ^ ((67108863 >>> o) << o),
                c = r;
              if (((i -= s), (i = Math.max(0, i)), c)) {
                for (var u = 0; u < s; u++) c.words[u] = this.words[u];
                c.length = s;
              }
              if (0 === s);
              else if (this.length > s)
                for (this.length -= s, u = 0; u < this.length; u++)
                  this.words[u] = this.words[u + s];
              else (this.words[0] = 0), (this.length = 1);
              var h = 0;
              for (u = this.length - 1; u >= 0 && (0 !== h || u >= i); u--) {
                var l = 0 | this.words[u];
                (this.words[u] = (h << (26 - o)) | (l >>> o)), (h = l & a);
              }
              return (
                c && 0 !== h && (c.words[c.length++] = h),
                0 === this.length && ((this.words[0] = 0), (this.length = 1)),
                this._strip()
              );
            }),
            (o.prototype.ishrn = function (t, e, r) {
              return n(0 === this.negative), this.iushrn(t, e, r);
            }),
            (o.prototype.shln = function (t) {
              return this.clone().ishln(t);
            }),
            (o.prototype.ushln = function (t) {
              return this.clone().iushln(t);
            }),
            (o.prototype.shrn = function (t) {
              return this.clone().ishrn(t);
            }),
            (o.prototype.ushrn = function (t) {
              return this.clone().iushrn(t);
            }),
            (o.prototype.testn = function (t) {
              n("number" == typeof t && t >= 0);
              var e = t % 26,
                r = (t - e) / 26,
                i = 1 << e;
              return !(this.length <= r) && !!(this.words[r] & i);
            }),
            (o.prototype.imaskn = function (t) {
              n("number" == typeof t && t >= 0);
              var e = t % 26,
                r = (t - e) / 26;
              if (
                (n(0 === this.negative, "imaskn works only with positive numbers"),
                this.length <= r)
              )
                return this;
              if ((0 !== e && r++, (this.length = Math.min(r, this.length)), 0 !== e)) {
                var i = 67108863 ^ ((67108863 >>> e) << e);
                this.words[this.length - 1] &= i;
              }
              return this._strip();
            }),
            (o.prototype.maskn = function (t) {
              return this.clone().imaskn(t);
            }),
            (o.prototype.iaddn = function (t) {
              return (
                n("number" == typeof t),
                n(t < 67108864),
                t < 0
                  ? this.isubn(-t)
                  : 0 !== this.negative
                    ? 1 === this.length && (0 | this.words[0]) <= t
                      ? ((this.words[0] = t - (0 | this.words[0])), (this.negative = 0), this)
                      : ((this.negative = 0), this.isubn(t), (this.negative = 1), this)
                    : this._iaddn(t)
              );
            }),
            (o.prototype._iaddn = function (t) {
              this.words[0] += t;
              for (var e = 0; e < this.length && this.words[e] >= 67108864; e++)
                (this.words[e] -= 67108864),
                  e === this.length - 1 ? (this.words[e + 1] = 1) : this.words[e + 1]++;
              return (this.length = Math.max(this.length, e + 1)), this;
            }),
            (o.prototype.isubn = function (t) {
              if ((n("number" == typeof t), n(t < 67108864), t < 0)) return this.iaddn(-t);
              if (0 !== this.negative)
                return (this.negative = 0), this.iaddn(t), (this.negative = 1), this;
              if (((this.words[0] -= t), 1 === this.length && this.words[0] < 0))
                (this.words[0] = -this.words[0]), (this.negative = 1);
              else
                for (var e = 0; e < this.length && this.words[e] < 0; e++)
                  (this.words[e] += 67108864), (this.words[e + 1] -= 1);
              return this._strip();
            }),
            (o.prototype.addn = function (t) {
              return this.clone().iaddn(t);
            }),
            (o.prototype.subn = function (t) {
              return this.clone().isubn(t);
            }),
            (o.prototype.iabs = function () {
              return (this.negative = 0), this;
            }),
            (o.prototype.abs = function () {
              return this.clone().iabs();
            }),
            (o.prototype._ishlnsubmul = function (t, e, r) {
              var i,
                o,
                s = t.length + r;
              this._expand(s);
              var a = 0;
              for (i = 0; i < t.length; i++) {
                o = (0 | this.words[i + r]) + a;
                var c = (0 | t.words[i]) * e;
                (a = ((o -= 67108863 & c) >> 26) - ((c / 67108864) | 0)),
                  (this.words[i + r] = 67108863 & o);
              }
              for (; i < this.length - r; i++)
                (a = (o = (0 | this.words[i + r]) + a) >> 26), (this.words[i + r] = 67108863 & o);
              if (0 === a) return this._strip();
              for (n(-1 === a), a = 0, i = 0; i < this.length; i++)
                (a = (o = -(0 | this.words[i]) + a) >> 26), (this.words[i] = 67108863 & o);
              return (this.negative = 1), this._strip();
            }),
            (o.prototype._wordDiv = function (t, e) {
              var r = (this.length, t.length),
                n = this.clone(),
                i = t,
                s = 0 | i.words[i.length - 1];
              0 !== (r = 26 - this._countBits(s)) &&
                ((i = i.ushln(r)), n.iushln(r), (s = 0 | i.words[i.length - 1]));
              var a,
                c = n.length - i.length;
              if ("mod" !== e) {
                ((a = new o(null)).length = c + 1), (a.words = new Array(a.length));
                for (var u = 0; u < a.length; u++) a.words[u] = 0;
              }
              var h = n.clone()._ishlnsubmul(i, 1, c);
              0 === h.negative && ((n = h), a && (a.words[c] = 1));
              for (var l = c - 1; l >= 0; l--) {
                var f = 67108864 * (0 | n.words[i.length + l]) + (0 | n.words[i.length + l - 1]);
                for (
                  f = Math.min((f / s) | 0, 67108863), n._ishlnsubmul(i, f, l);
                  0 !== n.negative;
                )
                  f--, (n.negative = 0), n._ishlnsubmul(i, 1, l), n.isZero() || (n.negative ^= 1);
                a && (a.words[l] = f);
              }
              return (
                a && a._strip(),
                n._strip(),
                "div" !== e && 0 !== r && n.iushrn(r),
                {
                  div: a || null,
                  mod: n,
                }
              );
            }),
            (o.prototype.divmod = function (t, e, r) {
              return (
                n(!t.isZero()),
                this.isZero()
                  ? {
                      div: new o(0),
                      mod: new o(0),
                    }
                  : 0 !== this.negative && 0 === t.negative
                    ? ((a = this.neg().divmod(t, e)),
                      "mod" !== e && (i = a.div.neg()),
                      "div" !== e && ((s = a.mod.neg()), r && 0 !== s.negative && s.iadd(t)),
                      {
                        div: i,
                        mod: s,
                      })
                    : 0 === this.negative && 0 !== t.negative
                      ? ((a = this.divmod(t.neg(), e)),
                        "mod" !== e && (i = a.div.neg()),
                        {
                          div: i,
                          mod: a.mod,
                        })
                      : 0 != (this.negative & t.negative)
                        ? ((a = this.neg().divmod(t.neg(), e)),
                          "div" !== e && ((s = a.mod.neg()), r && 0 !== s.negative && s.isub(t)),
                          {
                            div: a.div,
                            mod: s,
                          })
                        : t.length > this.length || this.cmp(t) < 0
                          ? {
                              div: new o(0),
                              mod: this,
                            }
                          : 1 === t.length
                            ? "div" === e
                              ? {
                                  div: this.divn(t.words[0]),
                                  mod: null,
                                }
                              : "mod" === e
                                ? {
                                    div: null,
                                    mod: new o(this.modrn(t.words[0])),
                                  }
                                : {
                                    div: this.divn(t.words[0]),
                                    mod: new o(this.modrn(t.words[0])),
                                  }
                            : this._wordDiv(t, e)
              );
              var i, s, a;
            }),
            (o.prototype.div = function (t) {
              return this.divmod(t, "div", !1).div;
            }),
            (o.prototype.mod = function (t) {
              return this.divmod(t, "mod", !1).mod;
            }),
            (o.prototype.umod = function (t) {
              return this.divmod(t, "mod", !0).mod;
            }),
            (o.prototype.divRound = function (t) {
              var e = this.divmod(t);
              if (e.mod.isZero()) return e.div;
              var r = 0 !== e.div.negative ? e.mod.isub(t) : e.mod,
                n = t.ushrn(1),
                i = t.andln(1),
                o = r.cmp(n);
              return o < 0 || (1 === i && 0 === o)
                ? e.div
                : 0 !== e.div.negative
                  ? e.div.isubn(1)
                  : e.div.iaddn(1);
            }),
            (o.prototype.modrn = function (t) {
              var e = t < 0;
              e && (t = -t), n(t <= 67108863);
              for (var r = (1 << 26) % t, i = 0, o = this.length - 1; o >= 0; o--)
                i = (r * i + (0 | this.words[o])) % t;
              return e ? -i : i;
            }),
            (o.prototype.modn = function (t) {
              return this.modrn(t);
            }),
            (o.prototype.idivn = function (t) {
              var e = t < 0;
              e && (t = -t), n(t <= 67108863);
              for (var r = 0, i = this.length - 1; i >= 0; i--) {
                var o = (0 | this.words[i]) + 67108864 * r;
                (this.words[i] = (o / t) | 0), (r = o % t);
              }
              return this._strip(), e ? this.ineg() : this;
            }),
            (o.prototype.divn = function (t) {
              return this.clone().idivn(t);
            }),
            (o.prototype.egcd = function (t) {
              n(0 === t.negative), n(!t.isZero());
              var e = this,
                r = t.clone();
              e = 0 !== e.negative ? e.umod(t) : e.clone();
              for (
                var i = new o(1), s = new o(0), a = new o(0), c = new o(1), u = 0;
                e.isEven() && r.isEven();
              )
                e.iushrn(1), r.iushrn(1), ++u;
              for (var h = r.clone(), l = e.clone(); !e.isZero(); ) {
                for (var f = 0, d = 1; 0 == (e.words[0] & d) && f < 26; ++f, d <<= 1);
                if (f > 0)
                  for (e.iushrn(f); f-- > 0; )
                    (i.isOdd() || s.isOdd()) && (i.iadd(h), s.isub(l)), i.iushrn(1), s.iushrn(1);
                for (var p = 0, y = 1; 0 == (r.words[0] & y) && p < 26; ++p, y <<= 1);
                if (p > 0)
                  for (r.iushrn(p); p-- > 0; )
                    (a.isOdd() || c.isOdd()) && (a.iadd(h), c.isub(l)), a.iushrn(1), c.iushrn(1);
                e.cmp(r) >= 0
                  ? (e.isub(r), i.isub(a), s.isub(c))
                  : (r.isub(e), a.isub(i), c.isub(s));
              }
              return {
                a,
                b: c,
                gcd: r.iushln(u),
              };
            }),
            (o.prototype._invmp = function (t) {
              n(0 === t.negative), n(!t.isZero());
              var e = this,
                r = t.clone();
              e = 0 !== e.negative ? e.umod(t) : e.clone();
              for (
                var i, s = new o(1), a = new o(0), c = r.clone();
                e.cmpn(1) > 0 && r.cmpn(1) > 0;
              ) {
                for (var u = 0, h = 1; 0 == (e.words[0] & h) && u < 26; ++u, h <<= 1);
                if (u > 0) for (e.iushrn(u); u-- > 0; ) s.isOdd() && s.iadd(c), s.iushrn(1);
                for (var l = 0, f = 1; 0 == (r.words[0] & f) && l < 26; ++l, f <<= 1);
                if (l > 0) for (r.iushrn(l); l-- > 0; ) a.isOdd() && a.iadd(c), a.iushrn(1);
                e.cmp(r) >= 0 ? (e.isub(r), s.isub(a)) : (r.isub(e), a.isub(s));
              }
              return (i = 0 === e.cmpn(1) ? s : a).cmpn(0) < 0 && i.iadd(t), i;
            }),
            (o.prototype.gcd = function (t) {
              if (this.isZero()) return t.abs();
              if (t.isZero()) return this.abs();
              var e = this.clone(),
                r = t.clone();
              (e.negative = 0), (r.negative = 0);
              for (var n = 0; e.isEven() && r.isEven(); n++) e.iushrn(1), r.iushrn(1);
              for (;;) {
                while (e.isEven()) e.iushrn(1);
                while (r.isEven()) r.iushrn(1);
                var i = e.cmp(r);
                if (i < 0) {
                  var o = e;
                  (e = r), (r = o);
                } else if (0 === i || 0 === r.cmpn(1)) break;
                e.isub(r);
              }
              return r.iushln(n);
            }),
            (o.prototype.invm = function (t) {
              return this.egcd(t).a.umod(t);
            }),
            (o.prototype.isEven = function () {
              return 0 == (1 & this.words[0]);
            }),
            (o.prototype.isOdd = function () {
              return 1 == (1 & this.words[0]);
            }),
            (o.prototype.andln = function (t) {
              return this.words[0] & t;
            }),
            (o.prototype.bincn = function (t) {
              n("number" == typeof t);
              var e = t % 26,
                r = (t - e) / 26,
                i = 1 << e;
              if (this.length <= r) return this._expand(r + 1), (this.words[r] |= i), this;
              for (var o = i, s = r; 0 !== o && s < this.length; s++) {
                var a = 0 | this.words[s];
                (o = (a += o) >>> 26), (a &= 67108863), (this.words[s] = a);
              }
              return 0 !== o && ((this.words[s] = o), this.length++), this;
            }),
            (o.prototype.isZero = function () {
              return 1 === this.length && 0 === this.words[0];
            }),
            (o.prototype.cmpn = function (t) {
              var e,
                r = t < 0;
              if (0 !== this.negative && !r) return -1;
              if (0 === this.negative && r) return 1;
              if ((this._strip(), this.length > 1)) e = 1;
              else {
                r && (t = -t), n(t <= 67108863, "Number is too big");
                var i = 0 | this.words[0];
                e = i === t ? 0 : i < t ? -1 : 1;
              }
              return 0 !== this.negative ? 0 | -e : e;
            }),
            (o.prototype.cmp = function (t) {
              if (0 !== this.negative && 0 === t.negative) return -1;
              if (0 === this.negative && 0 !== t.negative) return 1;
              var e = this.ucmp(t);
              return 0 !== this.negative ? 0 | -e : e;
            }),
            (o.prototype.ucmp = function (t) {
              if (this.length > t.length) return 1;
              if (this.length < t.length) return -1;
              for (var e = 0, r = this.length - 1; r >= 0; r--) {
                var n = 0 | this.words[r],
                  i = 0 | t.words[r];
                if (n !== i) {
                  n < i ? (e = -1) : n > i && (e = 1);
                  break;
                }
              }
              return e;
            }),
            (o.prototype.gtn = function (t) {
              return 1 === this.cmpn(t);
            }),
            (o.prototype.gt = function (t) {
              return 1 === this.cmp(t);
            }),
            (o.prototype.gten = function (t) {
              return this.cmpn(t) >= 0;
            }),
            (o.prototype.gte = function (t) {
              return this.cmp(t) >= 0;
            }),
            (o.prototype.ltn = function (t) {
              return -1 === this.cmpn(t);
            }),
            (o.prototype.lt = function (t) {
              return -1 === this.cmp(t);
            }),
            (o.prototype.lten = function (t) {
              return this.cmpn(t) <= 0;
            }),
            (o.prototype.lte = function (t) {
              return this.cmp(t) <= 0;
            }),
            (o.prototype.eqn = function (t) {
              return 0 === this.cmpn(t);
            }),
            (o.prototype.eq = function (t) {
              return 0 === this.cmp(t);
            }),
            (o.red = function (t) {
              return new I(t);
            }),
            (o.prototype.toRed = function (t) {
              return (
                n(!this.red, "Already a number in reduction context"),
                n(0 === this.negative, "red works only with positives"),
                t.convertTo(this)._forceRed(t)
              );
            }),
            (o.prototype.fromRed = function () {
              return (
                n(this.red, "fromRed works only with numbers in reduction context"),
                this.red.convertFrom(this)
              );
            }),
            (o.prototype._forceRed = function (t) {
              return (this.red = t), this;
            }),
            (o.prototype.forceRed = function (t) {
              return n(!this.red, "Already a number in reduction context"), this._forceRed(t);
            }),
            (o.prototype.redAdd = function (t) {
              return n(this.red, "redAdd works only with red numbers"), this.red.add(this, t);
            }),
            (o.prototype.redIAdd = function (t) {
              return n(this.red, "redIAdd works only with red numbers"), this.red.iadd(this, t);
            }),
            (o.prototype.redSub = function (t) {
              return n(this.red, "redSub works only with red numbers"), this.red.sub(this, t);
            }),
            (o.prototype.redISub = function (t) {
              return n(this.red, "redISub works only with red numbers"), this.red.isub(this, t);
            }),
            (o.prototype.redShl = function (t) {
              return n(this.red, "redShl works only with red numbers"), this.red.shl(this, t);
            }),
            (o.prototype.redMul = function (t) {
              return (
                n(this.red, "redMul works only with red numbers"),
                this.red._verify2(this, t),
                this.red.mul(this, t)
              );
            }),
            (o.prototype.redIMul = function (t) {
              return (
                n(this.red, "redMul works only with red numbers"),
                this.red._verify2(this, t),
                this.red.imul(this, t)
              );
            }),
            (o.prototype.redSqr = function () {
              return (
                n(this.red, "redSqr works only with red numbers"),
                this.red._verify1(this),
                this.red.sqr(this)
              );
            }),
            (o.prototype.redISqr = function () {
              return (
                n(this.red, "redISqr works only with red numbers"),
                this.red._verify1(this),
                this.red.isqr(this)
              );
            }),
            (o.prototype.redSqrt = function () {
              return (
                n(this.red, "redSqrt works only with red numbers"),
                this.red._verify1(this),
                this.red.sqrt(this)
              );
            }),
            (o.prototype.redInvm = function () {
              return (
                n(this.red, "redInvm works only with red numbers"),
                this.red._verify1(this),
                this.red.invm(this)
              );
            }),
            (o.prototype.redNeg = function () {
              return (
                n(this.red, "redNeg works only with red numbers"),
                this.red._verify1(this),
                this.red.neg(this)
              );
            }),
            (o.prototype.redPow = function (t) {
              return (
                n(this.red && !t.red, "redPow(normalNum)"),
                this.red._verify1(this),
                this.red.pow(this, t)
              );
            });
          var b = {
            k256: null,
            p224: null,
            p192: null,
            p25519: null,
          };

          function _(t, e) {
            (this.name = t),
              (this.p = new o(e, 16)),
              (this.n = this.p.bitLength()),
              (this.k = new o(1).iushln(this.n).isub(this.p)),
              (this.tmp = this._tmp());
          }

          function E() {
            _.call(
              this,
              "k256",
              "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f",
            );
          }

          function A() {
            _.call(this, "p224", "ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001");
          }

          function M() {
            _.call(this, "p192", "ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff");
          }

          function S() {
            _.call(
              this,
              "25519",
              "7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed",
            );
          }

          function I(t) {
            if ("string" == typeof t) {
              var e = o._prime(t);
              (this.m = e.p), (this.prime = e);
            } else n(t.gtn(1), "modulus must be greater than 1"), (this.m = t), (this.prime = null);
          }

          function k(t) {
            I.call(this, t),
              (this.shift = this.m.bitLength()),
              this.shift % 26 != 0 && (this.shift += 26 - (this.shift % 26)),
              (this.r = new o(1).iushln(this.shift)),
              (this.r2 = this.imod(this.r.sqr())),
              (this.rinv = this.r._invmp(this.m)),
              (this.minv = this.rinv.mul(this.r).isubn(1).div(this.m)),
              (this.minv = this.minv.umod(this.r)),
              (this.minv = this.r.sub(this.minv));
          }
          (_.prototype._tmp = function () {
            var t = new o(null);
            return (t.words = new Array(Math.ceil(this.n / 13))), t;
          }),
            (_.prototype.ireduce = function (t) {
              var e,
                r = t;
              do {
                this.split(r, this.tmp), (e = (r = (r = this.imulK(r)).iadd(this.tmp)).bitLength());
              } while (e > this.n);
              var n = e < this.n ? -1 : r.ucmp(this.p);
              return (
                0 === n
                  ? ((r.words[0] = 0), (r.length = 1))
                  : n > 0
                    ? r.isub(this.p)
                    : void 0 !== r.strip
                      ? r.strip()
                      : r._strip(),
                r
              );
            }),
            (_.prototype.split = function (t, e) {
              t.iushrn(this.n, 0, e);
            }),
            (_.prototype.imulK = function (t) {
              return t.imul(this.k);
            }),
            i(E, _),
            (E.prototype.split = function (t, e) {
              for (var r = 4194303, n = Math.min(t.length, 9), i = 0; i < n; i++)
                e.words[i] = t.words[i];
              if (((e.length = n), t.length <= 9)) return (t.words[0] = 0), void (t.length = 1);
              var o = t.words[9];
              for (e.words[e.length++] = o & r, i = 10; i < t.length; i++) {
                var s = 0 | t.words[i];
                (t.words[i - 10] = ((s & r) << 4) | (o >>> 22)), (o = s);
              }
              (o >>>= 22),
                (t.words[i - 10] = o),
                0 === o && t.length > 10 ? (t.length -= 10) : (t.length -= 9);
            }),
            (E.prototype.imulK = function (t) {
              (t.words[t.length] = 0), (t.words[t.length + 1] = 0), (t.length += 2);
              for (var e = 0, r = 0; r < t.length; r++) {
                var n = 0 | t.words[r];
                (e += 977 * n), (t.words[r] = 67108863 & e), (e = 64 * n + ((e / 67108864) | 0));
              }
              return (
                0 === t.words[t.length - 1] &&
                  (t.length--, 0 === t.words[t.length - 1] && t.length--),
                t
              );
            }),
            i(A, _),
            i(M, _),
            i(S, _),
            (S.prototype.imulK = function (t) {
              for (var e = 0, r = 0; r < t.length; r++) {
                var n = 19 * (0 | t.words[r]) + e,
                  i = 67108863 & n;
                (n >>>= 26), (t.words[r] = i), (e = n);
              }
              return 0 !== e && (t.words[t.length++] = e), t;
            }),
            (o._prime = function (t) {
              if (b[t]) return b[t];
              var e;
              if ("k256" === t) e = new E();
              else if ("p224" === t) e = new A();
              else if ("p192" === t) e = new M();
              else {
                if ("p25519" !== t) throw new Error("Unknown prime " + t);
                e = new S();
              }
              return (b[t] = e), e;
            }),
            (I.prototype._verify1 = function (t) {
              n(0 === t.negative, "red works only with positives"),
                n(t.red, "red works only with red numbers");
            }),
            (I.prototype._verify2 = function (t, e) {
              n(0 == (t.negative | e.negative), "red works only with positives"),
                n(t.red && t.red === e.red, "red works only with red numbers");
            }),
            (I.prototype.imod = function (t) {
              return this.prime
                ? this.prime.ireduce(t)._forceRed(this)
                : (h(t, t.umod(this.m)._forceRed(this)), t);
            }),
            (I.prototype.neg = function (t) {
              return t.isZero() ? t.clone() : this.m.sub(t)._forceRed(this);
            }),
            (I.prototype.add = function (t, e) {
              this._verify2(t, e);
              var r = t.add(e);
              return r.cmp(this.m) >= 0 && r.isub(this.m), r._forceRed(this);
            }),
            (I.prototype.iadd = function (t, e) {
              this._verify2(t, e);
              var r = t.iadd(e);
              return r.cmp(this.m) >= 0 && r.isub(this.m), r;
            }),
            (I.prototype.sub = function (t, e) {
              this._verify2(t, e);
              var r = t.sub(e);
              return r.cmpn(0) < 0 && r.iadd(this.m), r._forceRed(this);
            }),
            (I.prototype.isub = function (t, e) {
              this._verify2(t, e);
              var r = t.isub(e);
              return r.cmpn(0) < 0 && r.iadd(this.m), r;
            }),
            (I.prototype.shl = function (t, e) {
              return this._verify1(t), this.imod(t.ushln(e));
            }),
            (I.prototype.imul = function (t, e) {
              return this._verify2(t, e), this.imod(t.imul(e));
            }),
            (I.prototype.mul = function (t, e) {
              return this._verify2(t, e), this.imod(t.mul(e));
            }),
            (I.prototype.isqr = function (t) {
              return this.imul(t, t.clone());
            }),
            (I.prototype.sqr = function (t) {
              return this.mul(t, t);
            }),
            (I.prototype.sqrt = function (t) {
              if (t.isZero()) return t.clone();
              var e = this.m.andln(3);
              if ((n(e % 2 == 1), 3 === e)) {
                var r = this.m.add(new o(1)).iushrn(2);
                return this.pow(t, r);
              }
              for (var i = this.m.subn(1), s = 0; !i.isZero() && 0 === i.andln(1); )
                s++, i.iushrn(1);
              n(!i.isZero());
              var a = new o(1).toRed(this),
                c = a.redNeg(),
                u = this.m.subn(1).iushrn(1),
                h = this.m.bitLength();
              for (h = new o(2 * h * h).toRed(this); 0 !== this.pow(h, u).cmp(c); ) h.redIAdd(c);
              for (
                var l = this.pow(h, i),
                  f = this.pow(t, i.addn(1).iushrn(1)),
                  d = this.pow(t, i),
                  p = s;
                0 !== d.cmp(a);
              ) {
                for (var y = d, m = 0; 0 !== y.cmp(a); m++) y = y.redSqr();
                n(m < p);
                var g = this.pow(l, new o(1).iushln(p - m - 1));
                (f = f.redMul(g)), (l = g.redSqr()), (d = d.redMul(l)), (p = m);
              }
              return f;
            }),
            (I.prototype.invm = function (t) {
              var e = t._invmp(this.m);
              return 0 !== e.negative ? ((e.negative = 0), this.imod(e).redNeg()) : this.imod(e);
            }),
            (I.prototype.pow = function (t, e) {
              if (e.isZero()) return new o(1).toRed(this);
              if (0 === e.cmpn(1)) return t.clone();
              var r = new Array(16);
              (r[0] = new o(1).toRed(this)), (r[1] = t);
              for (var n = 2; n < r.length; n++) r[n] = this.mul(r[n - 1], t);
              var i = r[0],
                s = 0,
                a = 0,
                c = e.bitLength() % 26;
              for (0 === c && (c = 26), n = e.length - 1; n >= 0; n--) {
                for (var u = e.words[n], h = c - 1; h >= 0; h--) {
                  var l = (u >> h) & 1;
                  i !== r[0] && (i = this.sqr(i)),
                    0 !== l || 0 !== s
                      ? ((s <<= 1),
                        (s |= l),
                        (4 === ++a || (0 === n && 0 === h)) &&
                          ((i = this.mul(i, r[s])), (a = 0), (s = 0)))
                      : (a = 0);
                }
                c = 26;
              }
              return i;
            }),
            (I.prototype.convertTo = function (t) {
              var e = t.umod(this.m);
              return e === t ? e.clone() : e;
            }),
            (I.prototype.convertFrom = function (t) {
              var e = t.clone();
              return (e.red = null), e;
            }),
            (o.mont = function (t) {
              return new k(t);
            }),
            i(k, I),
            (k.prototype.convertTo = function (t) {
              return this.imod(t.ushln(this.shift));
            }),
            (k.prototype.convertFrom = function (t) {
              var e = this.imod(t.mul(this.rinv));
              return (e.red = null), e;
            }),
            (k.prototype.imul = function (t, e) {
              if (t.isZero() || e.isZero()) return (t.words[0] = 0), (t.length = 1), t;
              var r = t.imul(e),
                n = r.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m),
                i = r.isub(n).iushrn(this.shift),
                o = i;
              return (
                i.cmp(this.m) >= 0 ? (o = i.isub(this.m)) : i.cmpn(0) < 0 && (o = i.iadd(this.m)),
                o._forceRed(this)
              );
            }),
            (k.prototype.mul = function (t, e) {
              if (t.isZero() || e.isZero()) return new o(0)._forceRed(this);
              var r = t.mul(e),
                n = r.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m),
                i = r.isub(n).iushrn(this.shift),
                s = i;
              return (
                i.cmp(this.m) >= 0 ? (s = i.isub(this.m)) : i.cmpn(0) < 0 && (s = i.iadd(this.m)),
                s._forceRed(this)
              );
            }),
            (k.prototype.invm = function (t) {
              return this.imod(t._invmp(this.m).mul(this.r2))._forceRed(this);
            });
        })((t = r.nmd(t)), this);
      },
      25532: function (t, e, r) {
        var n = r(48764).Buffer,
          i =
            (this && this.__createBinding) ||
            (Object.create
              ? function (t, e, r, n) {
                  void 0 === n && (n = r),
                    Object.defineProperty(t, n, {
                      enumerable: !0,
                      get: function () {
                        return e[r];
                      },
                    });
                }
              : function (t, e, r, n) {
                  void 0 === n && (n = r), (t[n] = e[r]);
                }),
          o =
            (this && this.__setModuleDefault) ||
            (Object.create
              ? function (t, e) {
                  Object.defineProperty(t, "default", {
                    enumerable: !0,
                    value: e,
                  });
                }
              : function (t, e) {
                  t.default = e;
                }),
          s =
            (this && this.__decorate) ||
            function (t, e, r, n) {
              var i,
                o = arguments.length,
                s = o < 3 ? e : null === n ? (n = Object.getOwnPropertyDescriptor(e, r)) : n;
              if ("object" == typeof Reflect && "function" == typeof Reflect.decorate)
                s = Reflect.decorate(t, e, r, n);
              else
                for (var a = t.length - 1; a >= 0; a--)
                  (i = t[a]) && (s = (o < 3 ? i(s) : o > 3 ? i(e, r, s) : i(e, r)) || s);
              return o > 3 && s && Object.defineProperty(e, r, s), s;
            },
          a =
            (this && this.__importStar) ||
            function (t) {
              if (t && t.__esModule) return t;
              var e = {};
              if (null != t)
                for (var r in t) "default" !== r && Object.hasOwnProperty.call(t, r) && i(e, t, r);
              return o(e, t), e;
            },
          c =
            (this && this.__importDefault) ||
            function (t) {
              return t && t.__esModule
                ? t
                : {
                    default: t,
                  };
            };
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.deserializeUnchecked =
            e.deserialize =
            e.serialize =
            e.BinaryReader =
            e.BinaryWriter =
            e.BorshError =
            e.baseDecode =
            e.baseEncode =
              void 0);
        const u = c(r(13550)),
          h = c(r(77191)),
          l = a(r(11379)),
          f = new ("function" != typeof r.g.TextDecoder ? l.TextDecoder : r.g.TextDecoder)(
            "utf-8",
            {
              fatal: !0,
            },
          );
        (e.baseEncode = function (t) {
          return "string" == typeof t && (t = n.from(t, "utf8")), h.default.encode(n.from(t));
        }),
          (e.baseDecode = function (t) {
            return n.from(h.default.decode(t));
          });
        const d = 1024;
        class p extends Error {
          constructor(t) {
            super(t), (this.fieldPath = []), (this.originalMessage = t);
          }
          addToFieldPath(t) {
            this.fieldPath.splice(0, 0, t),
              (this.message = this.originalMessage + ": " + this.fieldPath.join("."));
          }
        }
        e.BorshError = p;
        class y {
          constructor() {
            (this.buf = n.alloc(d)), (this.length = 0);
          }
          maybeResize() {
            this.buf.length < 16 + this.length && (this.buf = n.concat([this.buf, n.alloc(d)]));
          }
          writeU8(t) {
            this.maybeResize(), this.buf.writeUInt8(t, this.length), (this.length += 1);
          }
          writeU16(t) {
            this.maybeResize(), this.buf.writeUInt16LE(t, this.length), (this.length += 2);
          }
          writeU32(t) {
            this.maybeResize(), this.buf.writeUInt32LE(t, this.length), (this.length += 4);
          }
          writeU64(t) {
            this.maybeResize(), this.writeBuffer(n.from(new u.default(t).toArray("le", 8)));
          }
          writeU128(t) {
            this.maybeResize(), this.writeBuffer(n.from(new u.default(t).toArray("le", 16)));
          }
          writeU256(t) {
            this.maybeResize(), this.writeBuffer(n.from(new u.default(t).toArray("le", 32)));
          }
          writeU512(t) {
            this.maybeResize(), this.writeBuffer(n.from(new u.default(t).toArray("le", 64)));
          }
          writeBuffer(t) {
            (this.buf = n.concat([n.from(this.buf.subarray(0, this.length)), t, n.alloc(d)])),
              (this.length += t.length);
          }
          writeString(t) {
            this.maybeResize();
            const e = n.from(t, "utf8");
            this.writeU32(e.length), this.writeBuffer(e);
          }
          writeFixedArray(t) {
            this.writeBuffer(n.from(t));
          }
          writeArray(t, e) {
            this.maybeResize(), this.writeU32(t.length);
            for (const r of t) this.maybeResize(), e(r);
          }
          toArray() {
            return this.buf.subarray(0, this.length);
          }
        }

        function m(t, e, r) {
          const n = r.value;
          r.value = function (...t) {
            try {
              return n.apply(this, t);
            } catch (t) {
              if (t instanceof RangeError) {
                const e = t.code;
                if (["ERR_BUFFER_OUT_OF_BOUNDS", "ERR_OUT_OF_RANGE"].indexOf(e) >= 0)
                  throw new p("Reached the end of buffer when deserializing");
              }
              throw t;
            }
          };
        }
        e.BinaryWriter = y;
        class g {
          constructor(t) {
            (this.buf = t), (this.offset = 0);
          }
          readU8() {
            const t = this.buf.readUInt8(this.offset);
            return (this.offset += 1), t;
          }
          readU16() {
            const t = this.buf.readUInt16LE(this.offset);
            return (this.offset += 2), t;
          }
          readU32() {
            const t = this.buf.readUInt32LE(this.offset);
            return (this.offset += 4), t;
          }
          readU64() {
            const t = this.readBuffer(8);
            return new u.default(t, "le");
          }
          readU128() {
            const t = this.readBuffer(16);
            return new u.default(t, "le");
          }
          readU256() {
            const t = this.readBuffer(32);
            return new u.default(t, "le");
          }
          readU512() {
            const t = this.readBuffer(64);
            return new u.default(t, "le");
          }
          readBuffer(t) {
            if (this.offset + t > this.buf.length)
              throw new p(`Expected buffer length ${t} isn't within bounds`);
            const e = this.buf.slice(this.offset, this.offset + t);
            return (this.offset += t), e;
          }
          readString() {
            const t = this.readU32(),
              e = this.readBuffer(t);
            try {
              return f.decode(e);
            } catch (t) {
              throw new p(`Error decoding UTF-8 string: ${t}`);
            }
          }
          readFixedArray(t) {
            return new Uint8Array(this.readBuffer(t));
          }
          readArray(t) {
            const e = this.readU32(),
              r = Array();
            for (let n = 0; n < e; ++n) r.push(t());
            return r;
          }
        }

        function w(t) {
          return t.charAt(0).toUpperCase() + t.slice(1);
        }

        function v(t, e, r, n, i) {
          try {
            if ("string" == typeof n) i[`write${w(n)}`](r);
            else if (n instanceof Array)
              if ("number" == typeof n[0]) {
                if (r.length !== n[0])
                  throw new p(`Expecting byte array of length ${n[0]}, but got ${r.length} bytes`);
                i.writeFixedArray(r);
              } else if (2 === n.length && "number" == typeof n[1]) {
                if (r.length !== n[1])
                  throw new p(`Expecting byte array of length ${n[1]}, but got ${r.length} bytes`);
                for (let e = 0; e < n[1]; e++) v(t, null, r[e], n[0], i);
              } else
                i.writeArray(r, (r) => {
                  v(t, e, r, n[0], i);
                });
            else if (void 0 !== n.kind) {
              if ("option" !== n.kind) throw new p(`FieldType ${n} unrecognized`);
              null == r ? i.writeU8(0) : (i.writeU8(1), v(t, e, r, n.type, i));
            } else b(t, r, i);
          } catch (t) {
            throw (t instanceof p && t.addToFieldPath(e), t);
          }
        }

        function b(t, e, r) {
          if ("function" == typeof e.borshSerialize) return void e.borshSerialize(r);
          const n = t.get(e.constructor);
          if (!n) throw new p(`Class ${e.constructor.name} is missing in schema`);
          if ("struct" === n.kind)
            n.fields.map(([n, i]) => {
              v(t, n, e[n], i, r);
            });
          else {
            if ("enum" !== n.kind)
              throw new p(`Unexpected schema kind: ${n.kind} for ${e.constructor.name}`);
            {
              const i = e[n.field];
              for (let o = 0; o < n.values.length; ++o) {
                const [s, a] = n.values[o];
                if (s === i) {
                  r.writeU8(o), v(t, s, e[s], a, r);
                  break;
                }
              }
            }
          }
        }

        function _(t, e, r, n) {
          try {
            if ("string" == typeof r) return n[`read${w(r)}`]();
            if (r instanceof Array) {
              if ("number" == typeof r[0]) return n.readFixedArray(r[0]);
              if ("number" == typeof r[1]) {
                const e = [];
                for (let i = 0; i < r[1]; i++) e.push(_(t, null, r[0], n));
                return e;
              }
              return n.readArray(() => _(t, e, r[0], n));
            }
            if ("option" === r.kind) {
              return n.readU8() ? _(t, e, r.type, n) : void 0;
            }
            return E(t, r, n);
          } catch (t) {
            throw (t instanceof p && t.addToFieldPath(e), t);
          }
        }

        function E(t, e, r) {
          if ("function" == typeof e.borshDeserialize) return e.borshDeserialize(r);
          const n = t.get(e);
          if (!n) throw new p(`Class ${e.name} is missing in schema`);
          if ("struct" === n.kind) {
            const n = {};
            for (const [i, o] of t.get(e).fields) n[i] = _(t, i, o, r);
            return new e(n);
          }
          if ("enum" === n.kind) {
            const i = r.readU8();
            if (i >= n.values.length) throw new p(`Enum index: ${i} is out of range`);
            const [o, s] = n.values[i];
            return new e({
              [o]: _(t, o, s, r),
            });
          }
          throw new p(`Unexpected schema kind: ${n.kind} for ${e.constructor.name}`);
        }
        s([m], g.prototype, "readU8", null),
          s([m], g.prototype, "readU16", null),
          s([m], g.prototype, "readU32", null),
          s([m], g.prototype, "readU64", null),
          s([m], g.prototype, "readU128", null),
          s([m], g.prototype, "readU256", null),
          s([m], g.prototype, "readU512", null),
          s([m], g.prototype, "readString", null),
          s([m], g.prototype, "readFixedArray", null),
          s([m], g.prototype, "readArray", null),
          (e.BinaryReader = g),
          (e.serialize = function (t, e, r = y) {
            const n = new r();
            return b(t, e, n), n.toArray();
          }),
          (e.deserialize = function (t, e, r, n = g) {
            const i = new n(r),
              o = E(t, e, i);
            if (i.offset < r.length)
              throw new p(`Unexpected ${r.length - i.offset} bytes after deserialized data`);
            return o;
          }),
          (e.deserializeUnchecked = function (t, e, r, n = g) {
            return E(t, e, new n(r));
          });
      },
      77191: (t, e, r) => {
        var n = r(58162);
        t.exports = n("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");
      },
      48764: (t, e, r) => {
        /*!
         * The buffer module from node.js, for the browser.
         *
         * @author   Feross Aboukhadijeh <https://feross.org>
         * @license  MIT
         */
        const n = r(79742),
          i = r(80645),
          o =
            "function" == typeof Symbol && "function" == typeof Symbol.for
              ? Symbol.for("nodejs.util.inspect.custom")
              : null;
        (e.Buffer = c),
          (e.SlowBuffer = function (t) {
            +t != t && (t = 0);
            return c.alloc(+t);
          }),
          (e.INSPECT_MAX_BYTES = 50);
        const s = 2147483647;

        function a(t) {
          if (t > s) throw new RangeError('The value "' + t + '" is invalid for option "size"');
          const e = new Uint8Array(t);
          return Object.setPrototypeOf(e, c.prototype), e;
        }

        function c(t, e, r) {
          if ("number" == typeof t) {
            if ("string" == typeof e)
              throw new TypeError(
                'The "string" argument must be of type string. Received type number',
              );
            return l(t);
          }
          return u(t, e, r);
        }

        function u(t, e, r) {
          if ("string" == typeof t)
            return (function (t, e) {
              ("string" == typeof e && "" !== e) || (e = "utf8");
              if (!c.isEncoding(e)) throw new TypeError("Unknown encoding: " + e);
              const r = 0 | y(t, e);
              let n = a(r);
              const i = n.write(t, e);
              i !== r && (n = n.slice(0, i));
              return n;
            })(t, e);
          if (ArrayBuffer.isView(t))
            return (function (t) {
              if (J(t, Uint8Array)) {
                const e = new Uint8Array(t);
                return d(e.buffer, e.byteOffset, e.byteLength);
              }
              return f(t);
            })(t);
          if (null == t)
            throw new TypeError(
              "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " +
                typeof t,
            );
          if (J(t, ArrayBuffer) || (t && J(t.buffer, ArrayBuffer))) return d(t, e, r);
          if (
            "undefined" != typeof SharedArrayBuffer &&
            (J(t, SharedArrayBuffer) || (t && J(t.buffer, SharedArrayBuffer)))
          )
            return d(t, e, r);
          if ("number" == typeof t)
            throw new TypeError(
              'The "value" argument must not be of type number. Received type number',
            );
          const n = t.valueOf && t.valueOf();
          if (null != n && n !== t) return c.from(n, e, r);
          const i = (function (t) {
            if (c.isBuffer(t)) {
              const e = 0 | p(t.length),
                r = a(e);
              return 0 === r.length || t.copy(r, 0, 0, e), r;
            }
            if (void 0 !== t.length)
              return "number" != typeof t.length || V(t.length) ? a(0) : f(t);
            if ("Buffer" === t.type && Array.isArray(t.data)) return f(t.data);
          })(t);
          if (i) return i;
          if (
            "undefined" != typeof Symbol &&
            null != Symbol.toPrimitive &&
            "function" == typeof t[Symbol.toPrimitive]
          )
            return c.from(t[Symbol.toPrimitive]("string"), e, r);
          throw new TypeError(
            "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " +
              typeof t,
          );
        }

        function h(t) {
          if ("number" != typeof t) throw new TypeError('"size" argument must be of type number');
          if (t < 0) throw new RangeError('The value "' + t + '" is invalid for option "size"');
        }

        function l(t) {
          return h(t), a(t < 0 ? 0 : 0 | p(t));
        }

        function f(t) {
          const e = t.length < 0 ? 0 : 0 | p(t.length),
            r = a(e);
          for (let n = 0; n < e; n += 1) r[n] = 255 & t[n];
          return r;
        }

        function d(t, e, r) {
          if (e < 0 || t.byteLength < e)
            throw new RangeError('"offset" is outside of buffer bounds');
          if (t.byteLength < e + (r || 0))
            throw new RangeError('"length" is outside of buffer bounds');
          let n;
          return (
            (n =
              void 0 === e && void 0 === r
                ? new Uint8Array(t)
                : void 0 === r
                  ? new Uint8Array(t, e)
                  : new Uint8Array(t, e, r)),
            Object.setPrototypeOf(n, c.prototype),
            n
          );
        }

        function p(t) {
          if (t >= s)
            throw new RangeError(
              "Attempt to allocate Buffer larger than maximum size: 0x" + s.toString(16) + " bytes",
            );
          return 0 | t;
        }

        function y(t, e) {
          if (c.isBuffer(t)) return t.length;
          if (ArrayBuffer.isView(t) || J(t, ArrayBuffer)) return t.byteLength;
          if ("string" != typeof t)
            throw new TypeError(
              'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' +
                typeof t,
            );
          const r = t.length,
            n = arguments.length > 2 && !0 === arguments[2];
          if (!n && 0 === r) return 0;
          let i = !1;
          for (;;)
            switch (e) {
              case "ascii":
              case "latin1":
              case "binary":
                return r;
              case "utf8":
              case "utf-8":
                return G(t).length;
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return 2 * r;
              case "hex":
                return r >>> 1;
              case "base64":
                return X(t).length;
              default:
                if (i) return n ? -1 : G(t).length;
                (e = ("" + e).toLowerCase()), (i = !0);
            }
        }

        function m(t, e, r) {
          let n = !1;
          if (((void 0 === e || e < 0) && (e = 0), e > this.length)) return "";
          if (((void 0 === r || r > this.length) && (r = this.length), r <= 0)) return "";
          if ((r >>>= 0) <= (e >>>= 0)) return "";
          for (t || (t = "utf8"); ; )
            switch (t) {
              case "hex":
                return O(this, e, r);
              case "utf8":
              case "utf-8":
                return I(this, e, r);
              case "ascii":
                return x(this, e, r);
              case "latin1":
              case "binary":
                return T(this, e, r);
              case "base64":
                return S(this, e, r);
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return C(this, e, r);
              default:
                if (n) throw new TypeError("Unknown encoding: " + t);
                (t = (t + "").toLowerCase()), (n = !0);
            }
        }

        function g(t, e, r) {
          const n = t[e];
          (t[e] = t[r]), (t[r] = n);
        }

        function w(t, e, r, n, i) {
          if (0 === t.length) return -1;
          if (
            ("string" == typeof r
              ? ((n = r), (r = 0))
              : r > 2147483647
                ? (r = 2147483647)
                : r < -2147483648 && (r = -2147483648),
            V((r = +r)) && (r = i ? 0 : t.length - 1),
            r < 0 && (r = t.length + r),
            r >= t.length)
          ) {
            if (i) return -1;
            r = t.length - 1;
          } else if (r < 0) {
            if (!i) return -1;
            r = 0;
          }
          if (("string" == typeof e && (e = c.from(e, n)), c.isBuffer(e)))
            return 0 === e.length ? -1 : v(t, e, r, n, i);
          if ("number" == typeof e)
            return (
              (e &= 255),
              "function" == typeof Uint8Array.prototype.indexOf
                ? i
                  ? Uint8Array.prototype.indexOf.call(t, e, r)
                  : Uint8Array.prototype.lastIndexOf.call(t, e, r)
                : v(t, [e], r, n, i)
            );
          throw new TypeError("val must be string, number or Buffer");
        }

        function v(t, e, r, n, i) {
          let o,
            s = 1,
            a = t.length,
            c = e.length;
          if (
            void 0 !== n &&
            ("ucs2" === (n = String(n).toLowerCase()) ||
              "ucs-2" === n ||
              "utf16le" === n ||
              "utf-16le" === n)
          ) {
            if (t.length < 2 || e.length < 2) return -1;
            (s = 2), (a /= 2), (c /= 2), (r /= 2);
          }

          function u(t, e) {
            return 1 === s ? t[e] : t.readUInt16BE(e * s);
          }
          if (i) {
            let n = -1;
            for (o = r; o < a; o++)
              if (u(t, o) === u(e, -1 === n ? 0 : o - n)) {
                if ((-1 === n && (n = o), o - n + 1 === c)) return n * s;
              } else -1 !== n && (o -= o - n), (n = -1);
          } else
            for (r + c > a && (r = a - c), o = r; o >= 0; o--) {
              let r = !0;
              for (let n = 0; n < c; n++)
                if (u(t, o + n) !== u(e, n)) {
                  r = !1;
                  break;
                }
              if (r) return o;
            }
          return -1;
        }

        function b(t, e, r, n) {
          r = Number(r) || 0;
          const i = t.length - r;
          n ? (n = Number(n)) > i && (n = i) : (n = i);
          const o = e.length;
          let s;
          for (n > o / 2 && (n = o / 2), s = 0; s < n; ++s) {
            const n = parseInt(e.substr(2 * s, 2), 16);
            if (V(n)) return s;
            t[r + s] = n;
          }
          return s;
        }

        function _(t, e, r, n) {
          return W(G(e, t.length - r), t, r, n);
        }

        function E(t, e, r, n) {
          return W(
            (function (t) {
              const e = [];
              for (let r = 0; r < t.length; ++r) e.push(255 & t.charCodeAt(r));
              return e;
            })(e),
            t,
            r,
            n,
          );
        }

        function A(t, e, r, n) {
          return W(X(e), t, r, n);
        }

        function M(t, e, r, n) {
          return W(
            (function (t, e) {
              let r, n, i;
              const o = [];
              for (let s = 0; s < t.length && !((e -= 2) < 0); ++s)
                (r = t.charCodeAt(s)), (n = r >> 8), (i = r % 256), o.push(i), o.push(n);
              return o;
            })(e, t.length - r),
            t,
            r,
            n,
          );
        }

        function S(t, e, r) {
          return 0 === e && r === t.length ? n.fromByteArray(t) : n.fromByteArray(t.slice(e, r));
        }

        function I(t, e, r) {
          r = Math.min(t.length, r);
          const n = [];
          let i = e;
          while (i < r) {
            const e = t[i];
            let o = null,
              s = e > 239 ? 4 : e > 223 ? 3 : e > 191 ? 2 : 1;
            if (i + s <= r) {
              let r, n, a, c;
              switch (s) {
                case 1:
                  e < 128 && (o = e);
                  break;
                case 2:
                  (r = t[i + 1]),
                    128 == (192 & r) && ((c = ((31 & e) << 6) | (63 & r)), c > 127 && (o = c));
                  break;
                case 3:
                  (r = t[i + 1]),
                    (n = t[i + 2]),
                    128 == (192 & r) &&
                      128 == (192 & n) &&
                      ((c = ((15 & e) << 12) | ((63 & r) << 6) | (63 & n)),
                      c > 2047 && (c < 55296 || c > 57343) && (o = c));
                  break;
                case 4:
                  (r = t[i + 1]),
                    (n = t[i + 2]),
                    (a = t[i + 3]),
                    128 == (192 & r) &&
                      128 == (192 & n) &&
                      128 == (192 & a) &&
                      ((c = ((15 & e) << 18) | ((63 & r) << 12) | ((63 & n) << 6) | (63 & a)),
                      c > 65535 && c < 1114112 && (o = c));
              }
            }
            null === o
              ? ((o = 65533), (s = 1))
              : o > 65535 &&
                ((o -= 65536), n.push(((o >>> 10) & 1023) | 55296), (o = 56320 | (1023 & o))),
              n.push(o),
              (i += s);
          }
          return (function (t) {
            const e = t.length;
            if (e <= k) return String.fromCharCode.apply(String, t);
            let r = "",
              n = 0;
            while (n < e) r += String.fromCharCode.apply(String, t.slice(n, (n += k)));
            return r;
          })(n);
        }
        (e.kMaxLength = s),
          (c.TYPED_ARRAY_SUPPORT = (function () {
            try {
              const t = new Uint8Array(1),
                e = {
                  foo: function () {
                    return 42;
                  },
                };
              return (
                Object.setPrototypeOf(e, Uint8Array.prototype),
                Object.setPrototypeOf(t, e),
                42 === t.foo()
              );
            } catch (t) {
              return !1;
            }
          })()),
          c.TYPED_ARRAY_SUPPORT ||
            "undefined" == typeof console ||
            "function" != typeof console.error ||
            console.error(
              "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.",
            ),
          Object.defineProperty(c.prototype, "parent", {
            enumerable: !0,
            get: function () {
              if (c.isBuffer(this)) return this.buffer;
            },
          }),
          Object.defineProperty(c.prototype, "offset", {
            enumerable: !0,
            get: function () {
              if (c.isBuffer(this)) return this.byteOffset;
            },
          }),
          (c.poolSize = 8192),
          (c.from = function (t, e, r) {
            return u(t, e, r);
          }),
          Object.setPrototypeOf(c.prototype, Uint8Array.prototype),
          Object.setPrototypeOf(c, Uint8Array),
          (c.alloc = function (t, e, r) {
            return (function (t, e, r) {
              return (
                h(t),
                t <= 0
                  ? a(t)
                  : void 0 !== e
                    ? "string" == typeof r
                      ? a(t).fill(e, r)
                      : a(t).fill(e)
                    : a(t)
              );
            })(t, e, r);
          }),
          (c.allocUnsafe = function (t) {
            return l(t);
          }),
          (c.allocUnsafeSlow = function (t) {
            return l(t);
          }),
          (c.isBuffer = function (t) {
            return null != t && !0 === t._isBuffer && t !== c.prototype;
          }),
          (c.compare = function (t, e) {
            if (
              (J(t, Uint8Array) && (t = c.from(t, t.offset, t.byteLength)),
              J(e, Uint8Array) && (e = c.from(e, e.offset, e.byteLength)),
              !c.isBuffer(t) || !c.isBuffer(e))
            )
              throw new TypeError(
                'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array',
              );
            if (t === e) return 0;
            let r = t.length,
              n = e.length;
            for (let i = 0, o = Math.min(r, n); i < o; ++i)
              if (t[i] !== e[i]) {
                (r = t[i]), (n = e[i]);
                break;
              }
            return r < n ? -1 : n < r ? 1 : 0;
          }),
          (c.isEncoding = function (t) {
            switch (String(t).toLowerCase()) {
              case "hex":
              case "utf8":
              case "utf-8":
              case "ascii":
              case "latin1":
              case "binary":
              case "base64":
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return !0;
              default:
                return !1;
            }
          }),
          (c.concat = function (t, e) {
            if (!Array.isArray(t))
              throw new TypeError('"list" argument must be an Array of Buffers');
            if (0 === t.length) return c.alloc(0);
            let r;
            if (void 0 === e) for (e = 0, r = 0; r < t.length; ++r) e += t[r].length;
            const n = c.allocUnsafe(e);
            let i = 0;
            for (r = 0; r < t.length; ++r) {
              let e = t[r];
              if (J(e, Uint8Array))
                i + e.length > n.length
                  ? (c.isBuffer(e) || (e = c.from(e)), e.copy(n, i))
                  : Uint8Array.prototype.set.call(n, e, i);
              else {
                if (!c.isBuffer(e))
                  throw new TypeError('"list" argument must be an Array of Buffers');
                e.copy(n, i);
              }
              i += e.length;
            }
            return n;
          }),
          (c.byteLength = y),
          (c.prototype._isBuffer = !0),
          (c.prototype.swap16 = function () {
            const t = this.length;
            if (t % 2 != 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
            for (let e = 0; e < t; e += 2) g(this, e, e + 1);
            return this;
          }),
          (c.prototype.swap32 = function () {
            const t = this.length;
            if (t % 4 != 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
            for (let e = 0; e < t; e += 4) g(this, e, e + 3), g(this, e + 1, e + 2);
            return this;
          }),
          (c.prototype.swap64 = function () {
            const t = this.length;
            if (t % 8 != 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
            for (let e = 0; e < t; e += 8)
              g(this, e, e + 7),
                g(this, e + 1, e + 6),
                g(this, e + 2, e + 5),
                g(this, e + 3, e + 4);
            return this;
          }),
          (c.prototype.toString = function () {
            const t = this.length;
            return 0 === t ? "" : 0 === arguments.length ? I(this, 0, t) : m.apply(this, arguments);
          }),
          (c.prototype.toLocaleString = c.prototype.toString),
          (c.prototype.equals = function (t) {
            if (!c.isBuffer(t)) throw new TypeError("Argument must be a Buffer");
            return this === t || 0 === c.compare(this, t);
          }),
          (c.prototype.inspect = function () {
            let t = "";
            const r = e.INSPECT_MAX_BYTES;
            return (
              (t = this.toString("hex", 0, r)
                .replace(/(.{2})/g, "$1 ")
                .trim()),
              this.length > r && (t += " ... "),
              "<Buffer " + t + ">"
            );
          }),
          o && (c.prototype[o] = c.prototype.inspect),
          (c.prototype.compare = function (t, e, r, n, i) {
            if ((J(t, Uint8Array) && (t = c.from(t, t.offset, t.byteLength)), !c.isBuffer(t)))
              throw new TypeError(
                'The "target" argument must be one of type Buffer or Uint8Array. Received type ' +
                  typeof t,
              );
            if (
              (void 0 === e && (e = 0),
              void 0 === r && (r = t ? t.length : 0),
              void 0 === n && (n = 0),
              void 0 === i && (i = this.length),
              e < 0 || r > t.length || n < 0 || i > this.length)
            )
              throw new RangeError("out of range index");
            if (n >= i && e >= r) return 0;
            if (n >= i) return -1;
            if (e >= r) return 1;
            if (this === t) return 0;
            let o = (i >>>= 0) - (n >>>= 0),
              s = (r >>>= 0) - (e >>>= 0);
            const a = Math.min(o, s),
              u = this.slice(n, i),
              h = t.slice(e, r);
            for (let t = 0; t < a; ++t)
              if (u[t] !== h[t]) {
                (o = u[t]), (s = h[t]);
                break;
              }
            return o < s ? -1 : s < o ? 1 : 0;
          }),
          (c.prototype.includes = function (t, e, r) {
            return -1 !== this.indexOf(t, e, r);
          }),
          (c.prototype.indexOf = function (t, e, r) {
            return w(this, t, e, r, !0);
          }),
          (c.prototype.lastIndexOf = function (t, e, r) {
            return w(this, t, e, r, !1);
          }),
          (c.prototype.write = function (t, e, r, n) {
            if (void 0 === e) (n = "utf8"), (r = this.length), (e = 0);
            else if (void 0 === r && "string" == typeof e) (n = e), (r = this.length), (e = 0);
            else {
              if (!isFinite(e))
                throw new Error(
                  "Buffer.write(string, encoding, offset[, length]) is no longer supported",
                );
              (e >>>= 0),
                isFinite(r) ? ((r >>>= 0), void 0 === n && (n = "utf8")) : ((n = r), (r = void 0));
            }
            const i = this.length - e;
            if (
              ((void 0 === r || r > i) && (r = i),
              (t.length > 0 && (r < 0 || e < 0)) || e > this.length)
            )
              throw new RangeError("Attempt to write outside buffer bounds");
            n || (n = "utf8");
            let o = !1;
            for (;;)
              switch (n) {
                case "hex":
                  return b(this, t, e, r);
                case "utf8":
                case "utf-8":
                  return _(this, t, e, r);
                case "ascii":
                case "latin1":
                case "binary":
                  return E(this, t, e, r);
                case "base64":
                  return A(this, t, e, r);
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return M(this, t, e, r);
                default:
                  if (o) throw new TypeError("Unknown encoding: " + n);
                  (n = ("" + n).toLowerCase()), (o = !0);
              }
          }),
          (c.prototype.toJSON = function () {
            return {
              type: "Buffer",
              data: Array.prototype.slice.call(this._arr || this, 0),
            };
          });
        const k = 4096;

        function x(t, e, r) {
          let n = "";
          r = Math.min(t.length, r);
          for (let i = e; i < r; ++i) n += String.fromCharCode(127 & t[i]);
          return n;
        }

        function T(t, e, r) {
          let n = "";
          r = Math.min(t.length, r);
          for (let i = e; i < r; ++i) n += String.fromCharCode(t[i]);
          return n;
        }

        function O(t, e, r) {
          const n = t.length;
          (!e || e < 0) && (e = 0), (!r || r < 0 || r > n) && (r = n);
          let i = "";
          for (let n = e; n < r; ++n) i += Y[t[n]];
          return i;
        }

        function C(t, e, r) {
          const n = t.slice(e, r);
          let i = "";
          for (let t = 0; t < n.length - 1; t += 2) i += String.fromCharCode(n[t] + 256 * n[t + 1]);
          return i;
        }

        function R(t, e, r) {
          if (t % 1 != 0 || t < 0) throw new RangeError("offset is not uint");
          if (t + e > r) throw new RangeError("Trying to access beyond buffer length");
        }

        function P(t, e, r, n, i, o) {
          if (!c.isBuffer(t)) throw new TypeError('"buffer" argument must be a Buffer instance');
          if (e > i || e < o) throw new RangeError('"value" argument is out of bounds');
          if (r + n > t.length) throw new RangeError("Index out of range");
        }

        function N(t, e, r, n, i) {
          H(e, n, i, t, r, 7);
          let o = Number(e & BigInt(4294967295));
          (t[r++] = o), (o >>= 8), (t[r++] = o), (o >>= 8), (t[r++] = o), (o >>= 8), (t[r++] = o);
          let s = Number((e >> BigInt(32)) & BigInt(4294967295));
          return (
            (t[r++] = s),
            (s >>= 8),
            (t[r++] = s),
            (s >>= 8),
            (t[r++] = s),
            (s >>= 8),
            (t[r++] = s),
            r
          );
        }

        function U(t, e, r, n, i) {
          H(e, n, i, t, r, 7);
          let o = Number(e & BigInt(4294967295));
          (t[r + 7] = o),
            (o >>= 8),
            (t[r + 6] = o),
            (o >>= 8),
            (t[r + 5] = o),
            (o >>= 8),
            (t[r + 4] = o);
          let s = Number((e >> BigInt(32)) & BigInt(4294967295));
          return (
            (t[r + 3] = s),
            (s >>= 8),
            (t[r + 2] = s),
            (s >>= 8),
            (t[r + 1] = s),
            (s >>= 8),
            (t[r] = s),
            r + 8
          );
        }

        function B(t, e, r, n, i, o) {
          if (r + n > t.length) throw new RangeError("Index out of range");
          if (r < 0) throw new RangeError("Index out of range");
        }

        function K(t, e, r, n, o) {
          return (e = +e), (r >>>= 0), o || B(t, 0, r, 4), i.write(t, e, r, n, 23, 4), r + 4;
        }

        function L(t, e, r, n, o) {
          return (e = +e), (r >>>= 0), o || B(t, 0, r, 8), i.write(t, e, r, n, 52, 8), r + 8;
        }
        (c.prototype.slice = function (t, e) {
          const r = this.length;
          (t = ~~t) < 0 ? (t += r) < 0 && (t = 0) : t > r && (t = r),
            (e = void 0 === e ? r : ~~e) < 0 ? (e += r) < 0 && (e = 0) : e > r && (e = r),
            e < t && (e = t);
          const n = this.subarray(t, e);
          return Object.setPrototypeOf(n, c.prototype), n;
        }),
          (c.prototype.readUintLE = c.prototype.readUIntLE =
            function (t, e, r) {
              (t >>>= 0), (e >>>= 0), r || R(t, e, this.length);
              let n = this[t],
                i = 1,
                o = 0;
              while (++o < e && (i *= 256)) n += this[t + o] * i;
              return n;
            }),
          (c.prototype.readUintBE = c.prototype.readUIntBE =
            function (t, e, r) {
              (t >>>= 0), (e >>>= 0), r || R(t, e, this.length);
              let n = this[t + --e],
                i = 1;
              while (e > 0 && (i *= 256)) n += this[t + --e] * i;
              return n;
            }),
          (c.prototype.readUint8 = c.prototype.readUInt8 =
            function (t, e) {
              return (t >>>= 0), e || R(t, 1, this.length), this[t];
            }),
          (c.prototype.readUint16LE = c.prototype.readUInt16LE =
            function (t, e) {
              return (t >>>= 0), e || R(t, 2, this.length), this[t] | (this[t + 1] << 8);
            }),
          (c.prototype.readUint16BE = c.prototype.readUInt16BE =
            function (t, e) {
              return (t >>>= 0), e || R(t, 2, this.length), (this[t] << 8) | this[t + 1];
            }),
          (c.prototype.readUint32LE = c.prototype.readUInt32LE =
            function (t, e) {
              return (
                (t >>>= 0),
                e || R(t, 4, this.length),
                (this[t] | (this[t + 1] << 8) | (this[t + 2] << 16)) + 16777216 * this[t + 3]
              );
            }),
          (c.prototype.readUint32BE = c.prototype.readUInt32BE =
            function (t, e) {
              return (
                (t >>>= 0),
                e || R(t, 4, this.length),
                16777216 * this[t] + ((this[t + 1] << 16) | (this[t + 2] << 8) | this[t + 3])
              );
            }),
          (c.prototype.readBigUInt64LE = Z(function (t) {
            q((t >>>= 0), "offset");
            const e = this[t],
              r = this[t + 7];
            (void 0 !== e && void 0 !== r) || $(t, this.length - 8);
            const n = e + 256 * this[++t] + 65536 * this[++t] + this[++t] * 2 ** 24,
              i = this[++t] + 256 * this[++t] + 65536 * this[++t] + r * 2 ** 24;
            return BigInt(n) + (BigInt(i) << BigInt(32));
          })),
          (c.prototype.readBigUInt64BE = Z(function (t) {
            q((t >>>= 0), "offset");
            const e = this[t],
              r = this[t + 7];
            (void 0 !== e && void 0 !== r) || $(t, this.length - 8);
            const n = e * 2 ** 24 + 65536 * this[++t] + 256 * this[++t] + this[++t],
              i = this[++t] * 2 ** 24 + 65536 * this[++t] + 256 * this[++t] + r;
            return (BigInt(n) << BigInt(32)) + BigInt(i);
          })),
          (c.prototype.readIntLE = function (t, e, r) {
            (t >>>= 0), (e >>>= 0), r || R(t, e, this.length);
            let n = this[t],
              i = 1,
              o = 0;
            while (++o < e && (i *= 256)) n += this[t + o] * i;
            return (i *= 128), n >= i && (n -= Math.pow(2, 8 * e)), n;
          }),
          (c.prototype.readIntBE = function (t, e, r) {
            (t >>>= 0), (e >>>= 0), r || R(t, e, this.length);
            let n = e,
              i = 1,
              o = this[t + --n];
            while (n > 0 && (i *= 256)) o += this[t + --n] * i;
            return (i *= 128), o >= i && (o -= Math.pow(2, 8 * e)), o;
          }),
          (c.prototype.readInt8 = function (t, e) {
            return (
              (t >>>= 0),
              e || R(t, 1, this.length),
              128 & this[t] ? -1 * (255 - this[t] + 1) : this[t]
            );
          }),
          (c.prototype.readInt16LE = function (t, e) {
            (t >>>= 0), e || R(t, 2, this.length);
            const r = this[t] | (this[t + 1] << 8);
            return 32768 & r ? 4294901760 | r : r;
          }),
          (c.prototype.readInt16BE = function (t, e) {
            (t >>>= 0), e || R(t, 2, this.length);
            const r = this[t + 1] | (this[t] << 8);
            return 32768 & r ? 4294901760 | r : r;
          }),
          (c.prototype.readInt32LE = function (t, e) {
            return (
              (t >>>= 0),
              e || R(t, 4, this.length),
              this[t] | (this[t + 1] << 8) | (this[t + 2] << 16) | (this[t + 3] << 24)
            );
          }),
          (c.prototype.readInt32BE = function (t, e) {
            return (
              (t >>>= 0),
              e || R(t, 4, this.length),
              (this[t] << 24) | (this[t + 1] << 16) | (this[t + 2] << 8) | this[t + 3]
            );
          }),
          (c.prototype.readBigInt64LE = Z(function (t) {
            q((t >>>= 0), "offset");
            const e = this[t],
              r = this[t + 7];
            (void 0 !== e && void 0 !== r) || $(t, this.length - 8);
            const n = this[t + 4] + 256 * this[t + 5] + 65536 * this[t + 6] + (r << 24);
            return (
              (BigInt(n) << BigInt(32)) +
              BigInt(e + 256 * this[++t] + 65536 * this[++t] + this[++t] * 2 ** 24)
            );
          })),
          (c.prototype.readBigInt64BE = Z(function (t) {
            q((t >>>= 0), "offset");
            const e = this[t],
              r = this[t + 7];
            (void 0 !== e && void 0 !== r) || $(t, this.length - 8);
            const n = (e << 24) + 65536 * this[++t] + 256 * this[++t] + this[++t];
            return (
              (BigInt(n) << BigInt(32)) +
              BigInt(this[++t] * 2 ** 24 + 65536 * this[++t] + 256 * this[++t] + r)
            );
          })),
          (c.prototype.readFloatLE = function (t, e) {
            return (t >>>= 0), e || R(t, 4, this.length), i.read(this, t, !0, 23, 4);
          }),
          (c.prototype.readFloatBE = function (t, e) {
            return (t >>>= 0), e || R(t, 4, this.length), i.read(this, t, !1, 23, 4);
          }),
          (c.prototype.readDoubleLE = function (t, e) {
            return (t >>>= 0), e || R(t, 8, this.length), i.read(this, t, !0, 52, 8);
          }),
          (c.prototype.readDoubleBE = function (t, e) {
            return (t >>>= 0), e || R(t, 8, this.length), i.read(this, t, !1, 52, 8);
          }),
          (c.prototype.writeUintLE = c.prototype.writeUIntLE =
            function (t, e, r, n) {
              if (((t = +t), (e >>>= 0), (r >>>= 0), !n)) {
                P(this, t, e, r, Math.pow(2, 8 * r) - 1, 0);
              }
              let i = 1,
                o = 0;
              for (this[e] = 255 & t; ++o < r && (i *= 256); ) this[e + o] = (t / i) & 255;
              return e + r;
            }),
          (c.prototype.writeUintBE = c.prototype.writeUIntBE =
            function (t, e, r, n) {
              if (((t = +t), (e >>>= 0), (r >>>= 0), !n)) {
                P(this, t, e, r, Math.pow(2, 8 * r) - 1, 0);
              }
              let i = r - 1,
                o = 1;
              for (this[e + i] = 255 & t; --i >= 0 && (o *= 256); ) this[e + i] = (t / o) & 255;
              return e + r;
            }),
          (c.prototype.writeUint8 = c.prototype.writeUInt8 =
            function (t, e, r) {
              return (
                (t = +t), (e >>>= 0), r || P(this, t, e, 1, 255, 0), (this[e] = 255 & t), e + 1
              );
            }),
          (c.prototype.writeUint16LE = c.prototype.writeUInt16LE =
            function (t, e, r) {
              return (
                (t = +t),
                (e >>>= 0),
                r || P(this, t, e, 2, 65535, 0),
                (this[e] = 255 & t),
                (this[e + 1] = t >>> 8),
                e + 2
              );
            }),
          (c.prototype.writeUint16BE = c.prototype.writeUInt16BE =
            function (t, e, r) {
              return (
                (t = +t),
                (e >>>= 0),
                r || P(this, t, e, 2, 65535, 0),
                (this[e] = t >>> 8),
                (this[e + 1] = 255 & t),
                e + 2
              );
            }),
          (c.prototype.writeUint32LE = c.prototype.writeUInt32LE =
            function (t, e, r) {
              return (
                (t = +t),
                (e >>>= 0),
                r || P(this, t, e, 4, 4294967295, 0),
                (this[e + 3] = t >>> 24),
                (this[e + 2] = t >>> 16),
                (this[e + 1] = t >>> 8),
                (this[e] = 255 & t),
                e + 4
              );
            }),
          (c.prototype.writeUint32BE = c.prototype.writeUInt32BE =
            function (t, e, r) {
              return (
                (t = +t),
                (e >>>= 0),
                r || P(this, t, e, 4, 4294967295, 0),
                (this[e] = t >>> 24),
                (this[e + 1] = t >>> 16),
                (this[e + 2] = t >>> 8),
                (this[e + 3] = 255 & t),
                e + 4
              );
            }),
          (c.prototype.writeBigUInt64LE = Z(function (t, e = 0) {
            return N(this, t, e, BigInt(0), BigInt("0xffffffffffffffff"));
          })),
          (c.prototype.writeBigUInt64BE = Z(function (t, e = 0) {
            return U(this, t, e, BigInt(0), BigInt("0xffffffffffffffff"));
          })),
          (c.prototype.writeIntLE = function (t, e, r, n) {
            if (((t = +t), (e >>>= 0), !n)) {
              const n = Math.pow(2, 8 * r - 1);
              P(this, t, e, r, n - 1, -n);
            }
            let i = 0,
              o = 1,
              s = 0;
            for (this[e] = 255 & t; ++i < r && (o *= 256); )
              t < 0 && 0 === s && 0 !== this[e + i - 1] && (s = 1),
                (this[e + i] = (((t / o) >> 0) - s) & 255);
            return e + r;
          }),
          (c.prototype.writeIntBE = function (t, e, r, n) {
            if (((t = +t), (e >>>= 0), !n)) {
              const n = Math.pow(2, 8 * r - 1);
              P(this, t, e, r, n - 1, -n);
            }
            let i = r - 1,
              o = 1,
              s = 0;
            for (this[e + i] = 255 & t; --i >= 0 && (o *= 256); )
              t < 0 && 0 === s && 0 !== this[e + i + 1] && (s = 1),
                (this[e + i] = (((t / o) >> 0) - s) & 255);
            return e + r;
          }),
          (c.prototype.writeInt8 = function (t, e, r) {
            return (
              (t = +t),
              (e >>>= 0),
              r || P(this, t, e, 1, 127, -128),
              t < 0 && (t = 255 + t + 1),
              (this[e] = 255 & t),
              e + 1
            );
          }),
          (c.prototype.writeInt16LE = function (t, e, r) {
            return (
              (t = +t),
              (e >>>= 0),
              r || P(this, t, e, 2, 32767, -32768),
              (this[e] = 255 & t),
              (this[e + 1] = t >>> 8),
              e + 2
            );
          }),
          (c.prototype.writeInt16BE = function (t, e, r) {
            return (
              (t = +t),
              (e >>>= 0),
              r || P(this, t, e, 2, 32767, -32768),
              (this[e] = t >>> 8),
              (this[e + 1] = 255 & t),
              e + 2
            );
          }),
          (c.prototype.writeInt32LE = function (t, e, r) {
            return (
              (t = +t),
              (e >>>= 0),
              r || P(this, t, e, 4, 2147483647, -2147483648),
              (this[e] = 255 & t),
              (this[e + 1] = t >>> 8),
              (this[e + 2] = t >>> 16),
              (this[e + 3] = t >>> 24),
              e + 4
            );
          }),
          (c.prototype.writeInt32BE = function (t, e, r) {
            return (
              (t = +t),
              (e >>>= 0),
              r || P(this, t, e, 4, 2147483647, -2147483648),
              t < 0 && (t = 4294967295 + t + 1),
              (this[e] = t >>> 24),
              (this[e + 1] = t >>> 16),
              (this[e + 2] = t >>> 8),
              (this[e + 3] = 255 & t),
              e + 4
            );
          }),
          (c.prototype.writeBigInt64LE = Z(function (t, e = 0) {
            return N(this, t, e, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
          })),
          (c.prototype.writeBigInt64BE = Z(function (t, e = 0) {
            return U(this, t, e, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
          })),
          (c.prototype.writeFloatLE = function (t, e, r) {
            return K(this, t, e, !0, r);
          }),
          (c.prototype.writeFloatBE = function (t, e, r) {
            return K(this, t, e, !1, r);
          }),
          (c.prototype.writeDoubleLE = function (t, e, r) {
            return L(this, t, e, !0, r);
          }),
          (c.prototype.writeDoubleBE = function (t, e, r) {
            return L(this, t, e, !1, r);
          }),
          (c.prototype.copy = function (t, e, r, n) {
            if (!c.isBuffer(t)) throw new TypeError("argument should be a Buffer");
            if (
              (r || (r = 0),
              n || 0 === n || (n = this.length),
              e >= t.length && (e = t.length),
              e || (e = 0),
              n > 0 && n < r && (n = r),
              n === r)
            )
              return 0;
            if (0 === t.length || 0 === this.length) return 0;
            if (e < 0) throw new RangeError("targetStart out of bounds");
            if (r < 0 || r >= this.length) throw new RangeError("Index out of range");
            if (n < 0) throw new RangeError("sourceEnd out of bounds");
            n > this.length && (n = this.length), t.length - e < n - r && (n = t.length - e + r);
            const i = n - r;
            return (
              this === t && "function" == typeof Uint8Array.prototype.copyWithin
                ? this.copyWithin(e, r, n)
                : Uint8Array.prototype.set.call(t, this.subarray(r, n), e),
              i
            );
          }),
          (c.prototype.fill = function (t, e, r, n) {
            if ("string" == typeof t) {
              if (
                ("string" == typeof e
                  ? ((n = e), (e = 0), (r = this.length))
                  : "string" == typeof r && ((n = r), (r = this.length)),
                void 0 !== n && "string" != typeof n)
              )
                throw new TypeError("encoding must be a string");
              if ("string" == typeof n && !c.isEncoding(n))
                throw new TypeError("Unknown encoding: " + n);
              if (1 === t.length) {
                const e = t.charCodeAt(0);
                (("utf8" === n && e < 128) || "latin1" === n) && (t = e);
              }
            } else "number" == typeof t ? (t &= 255) : "boolean" == typeof t && (t = Number(t));
            if (e < 0 || this.length < e || this.length < r)
              throw new RangeError("Out of range index");
            if (r <= e) return this;
            let i;
            if (
              ((e >>>= 0),
              (r = void 0 === r ? this.length : r >>> 0),
              t || (t = 0),
              "number" == typeof t)
            )
              for (i = e; i < r; ++i) this[i] = t;
            else {
              const o = c.isBuffer(t) ? t : c.from(t, n),
                s = o.length;
              if (0 === s)
                throw new TypeError('The value "' + t + '" is invalid for argument "value"');
              for (i = 0; i < r - e; ++i) this[i + e] = o[i % s];
            }
            return this;
          });
        const j = {};

        function F(t, e, r) {
          j[t] = class extends r {
            constructor() {
              super(),
                Object.defineProperty(this, "message", {
                  value: e.apply(this, arguments),
                  writable: !0,
                  configurable: !0,
                }),
                (this.name = `${this.name} [${t}]`),
                this.stack,
                delete this.name;
            }
            get code() {
              return t;
            }
            set code(t) {
              Object.defineProperty(this, "code", {
                configurable: !0,
                enumerable: !0,
                value: t,
                writable: !0,
              });
            }
            toString() {
              return `${this.name} [${t}]: ${this.message}`;
            }
          };
        }

        function D(t) {
          let e = "",
            r = t.length;
          const n = "-" === t[0] ? 1 : 0;
          for (; r >= n + 4; r -= 3) e = `_${t.slice(r - 3, r)}${e}`;
          return `${t.slice(0, r)}${e}`;
        }

        function H(t, e, r, n, i, o) {
          if (t > r || t < e) {
            const n = "bigint" == typeof e ? "n" : "";
            let i;
            throw (
              ((i =
                o > 3
                  ? 0 === e || e === BigInt(0)
                    ? `>= 0${n} and < 2${n} ** ${8 * (o + 1)}${n}`
                    : `>= -(2${n} ** ${8 * (o + 1) - 1}${n}) and < 2 ** ${8 * (o + 1) - 1}${n}`
                  : `>= ${e}${n} and <= ${r}${n}`),
              new j.ERR_OUT_OF_RANGE("value", i, t))
            );
          }
          !(function (t, e, r) {
            q(e, "offset"), (void 0 !== t[e] && void 0 !== t[e + r]) || $(e, t.length - (r + 1));
          })(n, i, o);
        }

        function q(t, e) {
          if ("number" != typeof t) throw new j.ERR_INVALID_ARG_TYPE(e, "number", t);
        }

        function $(t, e, r) {
          if (Math.floor(t) !== t)
            throw (q(t, r), new j.ERR_OUT_OF_RANGE(r || "offset", "an integer", t));
          if (e < 0) throw new j.ERR_BUFFER_OUT_OF_BOUNDS();
          throw new j.ERR_OUT_OF_RANGE(r || "offset", `>= ${r ? 1 : 0} and <= ${e}`, t);
        }
        F(
          "ERR_BUFFER_OUT_OF_BOUNDS",
          function (t) {
            return t
              ? `${t} is outside of buffer bounds`
              : "Attempt to access memory outside buffer bounds";
          },
          RangeError,
        ),
          F(
            "ERR_INVALID_ARG_TYPE",
            function (t, e) {
              return `The "${t}" argument must be of type number. Received type ${typeof e}`;
            },
            TypeError,
          ),
          F(
            "ERR_OUT_OF_RANGE",
            function (t, e, r) {
              let n = `The value of "${t}" is out of range.`,
                i = r;
              return (
                Number.isInteger(r) && Math.abs(r) > 2 ** 32
                  ? (i = D(String(r)))
                  : "bigint" == typeof r &&
                    ((i = String(r)),
                    (r > BigInt(2) ** BigInt(32) || r < -(BigInt(2) ** BigInt(32))) && (i = D(i)),
                    (i += "n")),
                (n += ` It must be ${e}. Received ${i}`),
                n
              );
            },
            RangeError,
          );
        const z = /[^+/0-9A-Za-z-_]/g;

        function G(t, e) {
          let r;
          e = e || 1 / 0;
          const n = t.length;
          let i = null;
          const o = [];
          for (let s = 0; s < n; ++s) {
            if (((r = t.charCodeAt(s)), r > 55295 && r < 57344)) {
              if (!i) {
                if (r > 56319) {
                  (e -= 3) > -1 && o.push(239, 191, 189);
                  continue;
                }
                if (s + 1 === n) {
                  (e -= 3) > -1 && o.push(239, 191, 189);
                  continue;
                }
                i = r;
                continue;
              }
              if (r < 56320) {
                (e -= 3) > -1 && o.push(239, 191, 189), (i = r);
                continue;
              }
              r = 65536 + (((i - 55296) << 10) | (r - 56320));
            } else i && (e -= 3) > -1 && o.push(239, 191, 189);
            if (((i = null), r < 128)) {
              if ((e -= 1) < 0) break;
              o.push(r);
            } else if (r < 2048) {
              if ((e -= 2) < 0) break;
              o.push((r >> 6) | 192, (63 & r) | 128);
            } else if (r < 65536) {
              if ((e -= 3) < 0) break;
              o.push((r >> 12) | 224, ((r >> 6) & 63) | 128, (63 & r) | 128);
            } else {
              if (!(r < 1114112)) throw new Error("Invalid code point");
              if ((e -= 4) < 0) break;
              o.push(
                (r >> 18) | 240,
                ((r >> 12) & 63) | 128,
                ((r >> 6) & 63) | 128,
                (63 & r) | 128,
              );
            }
          }
          return o;
        }

        function X(t) {
          return n.toByteArray(
            (function (t) {
              if ((t = (t = t.split("=")[0]).trim().replace(z, "")).length < 2) return "";
              while (t.length % 4 != 0) t += "=";
              return t;
            })(t),
          );
        }

        function W(t, e, r, n) {
          let i;
          for (i = 0; i < n && !(i + r >= e.length || i >= t.length); ++i) e[i + r] = t[i];
          return i;
        }

        function J(t, e) {
          return (
            t instanceof e ||
            (null != t &&
              null != t.constructor &&
              null != t.constructor.name &&
              t.constructor.name === e.name)
          );
        }

        function V(t) {
          return t != t;
        }
        const Y = (function () {
          const t = "0123456789abcdef",
            e = new Array(256);
          for (let r = 0; r < 16; ++r) {
            const n = 16 * r;
            for (let i = 0; i < 16; ++i) e[n + i] = t[r] + t[i];
          }
          return e;
        })();

        function Z(t) {
          return "undefined" == typeof BigInt ? Q : t;
        }

        function Q() {
          throw new Error("BigInt not supported");
        }
      },
      82894: (t, e, r) => {
        r(43567).check("es5");
      },
      43567: (t, e, r) => {
        r(89677), (t.exports = r(1100));
      },
      96085: (t) => {
        var e = function () {
          (this.tests = {}), (this.cache = {});
        };
        (e.prototype = {
          constructor: e,
          define: function (t, e) {
            if ("string" != typeof t || !(e instanceof Function))
              throw new Error("Invalid capability definition.");
            if (this.tests[t]) throw new Error('Duplicated capability definition by "' + t + '".');
            this.tests[t] = e;
          },
          check: function (t) {
            if (!this.test(t))
              throw new Error(
                'The current environment does not support "' +
                  t +
                  '", therefore we cannot continue.',
              );
          },
          test: function (t) {
            if (void 0 !== this.cache[t]) return this.cache[t];
            if (!this.tests[t]) throw new Error('Unknown capability with name "' + t + '".');
            var e = this.tests[t];
            return (this.cache[t] = !!e()), this.cache[t];
          },
        }),
          (t.exports = e);
      },
      89677: (t, e, r) => {
        var n = r(1100),
          i = n.define,
          o = n.test;
        i("strict mode", function () {
          return void 0 === this;
        }),
          i("arguments.callee.caller", function () {
            try {
              return (
                (function () {
                  return arguments.callee.caller;
                })() === arguments.callee
              );
            } catch (t) {
              return !1;
            }
          }),
          i("es5", function () {
            return (
              o("Array.prototype.forEach") &&
              o("Array.prototype.map") &&
              o("Function.prototype.bind") &&
              o("Object.create") &&
              o("Object.defineProperties") &&
              o("Object.defineProperty") &&
              o("Object.prototype.hasOwnProperty")
            );
          }),
          i("Array.prototype.forEach", function () {
            return Array.prototype.forEach;
          }),
          i("Array.prototype.map", function () {
            return Array.prototype.map;
          }),
          i("Function.prototype.bind", function () {
            return Function.prototype.bind;
          }),
          i("Object.create", function () {
            return Object.create;
          }),
          i("Object.defineProperties", function () {
            return Object.defineProperties;
          }),
          i("Object.defineProperty", function () {
            return Object.defineProperty;
          }),
          i("Object.prototype.hasOwnProperty", function () {
            return Object.prototype.hasOwnProperty;
          }),
          i("Error.captureStackTrace", function () {
            return Error.captureStackTrace;
          }),
          i("Error.prototype.stack", function () {
            try {
              throw new Error();
            } catch (t) {
              return t.stack || t.stacktrace;
            }
          });
      },
      1100: (t, e, r) => {
        var n = new (r(96085))(),
          i = function (t) {
            return n.test(t);
          };
        (i.define = function (t, e) {
          n.define(t, e);
        }),
          (i.check = function (t) {
            n.check(t);
          }),
          (i.test = i),
          (t.exports = i);
      },
      58010: (t, e, r) => {
        t.exports = r(87643);
      },
      87643: (t, e, r) => {
        r(82894);
        var n,
          i = r(43567);
        (n = i("Error.captureStackTrace")
          ? r(84649)
          : i("Error.prototype.stack")
            ? r(77862)
            : r(86688)),
          (t.exports = n());
      },
      21036: (t, e, r) => {
        var n = r(61589).Class,
          i = r(61589).abstractMethod,
          o = n(Object, {
            prototype: {
              init: n.prototype.merge,
              frameString: void 0,
              toString: function () {
                return this.frameString;
              },
              functionValue: void 0,
              getThis: i,
              getTypeName: i,
              getFunction: function () {
                return this.functionValue;
              },
              getFunctionName: i,
              getMethodName: i,
              getFileName: i,
              getLineNumber: i,
              getColumnNumber: i,
              getEvalOrigin: i,
              isTopLevel: i,
              isEval: i,
              isNative: i,
              isConstructor: i,
            },
          });
        t.exports = o;
      },
      59134: (t, e, r) => {
        var n = r(61589).Class,
          i = r(21036),
          o = r(17514).cache,
          s = n(Object, {
            prototype: {
              stackParser: null,
              frameParser: null,
              locationParsers: null,
              constructor: function (t) {
                n.prototype.merge.call(this, t);
              },
              getFrames: function (t, e) {
                for (var r = [], n = 0, i = t.length; n < i; ++n) r[n] = this.getFrame(t[n], e[n]);
                return r;
              },
              getFrame: function (t, e) {
                return new i({
                  frameString: t,
                  functionValue: e,
                });
              },
            },
          });
        t.exports = {
          getClass: o(function () {
            return s;
          }),
          getInstance: o(function () {
            return new (this.getClass())();
          }),
        };
      },
      50452: (t, e, r) => {
        var n = r(61589).Class,
          i = r(61589).abstractMethod,
          o = r(17514).eachCombination,
          s = r(17514).cache,
          a = r(43567),
          c = n(Object, {
            prototype: {
              captureFrameStrings: function (t) {
                var e = this.createError();
                t.unshift(this.captureFrameStrings), t.unshift(this.createError);
                var r = this.getFrameStrings(e),
                  n = r.slice(t.length),
                  i = [];
                if (a("arguments.callee.caller")) {
                  var o = [this.createError, this.captureFrameStrings];
                  try {
                    for (var s = arguments.callee; (s = s.caller); ) o.push(s);
                  } catch (t) {}
                  i = o.slice(t.length);
                }
                return {
                  frameStrings: n,
                  functionValues: i,
                };
              },
              getFrameStrings: function (t) {
                var e = t.message || "",
                  r = t.name || "",
                  n = this.getStackString(t);
                if (void 0 !== n) {
                  var i = n.split("\n"),
                    o = 0,
                    s = i.length;
                  return (
                    this.hasHeader && (o += r.split("\n").length + e.split("\n").length - 1),
                    this.hasFooter && (s -= 1),
                    i.slice(o, s)
                  );
                }
              },
              createError: i,
              getStackString: i,
              hasHeader: void 0,
              hasFooter: void 0,
            },
          }),
          u = n(Object, {
            prototype: {
              calibrateClass: function (t) {
                return this.calibrateMethods(t) && this.calibrateEnvelope(t);
              },
              calibrateMethods: function (t) {
                try {
                  o(
                    [
                      [
                        function (t) {
                          return new Error(t);
                        },
                        function (t) {
                          try {
                            throw new Error(t);
                          } catch (t) {
                            return t;
                          }
                        },
                      ],
                      [
                        function (t) {
                          return t.stack;
                        },
                        function (t) {
                          return t.stacktrace;
                        },
                      ],
                    ],
                    function (t, e) {
                      if (e(t()))
                        throw {
                          getStackString: e,
                          createError: t,
                        };
                    },
                  );
                } catch (e) {
                  return (
                    n.merge.call(t, {
                      prototype: e,
                    }),
                    !0
                  );
                }
                return !1;
              },
              calibrateEnvelope: function (t) {
                var e = (0, t.prototype.getStackString)(
                  (0, t.prototype.createError)("marker"),
                ).split("\n");
                return (
                  n.merge.call(t, {
                    prototype: {
                      hasHeader: /marker/.test(e[0]),
                      hasFooter: "" === e[e.length - 1],
                    },
                  }),
                  !0
                );
              },
            },
          });
        t.exports = {
          getClass: s(function () {
            var t;
            if (t) return t;
            if (((t = n(c, {})), !new u().calibrateClass(t)))
              throw new Error("Cannot read Error.prototype.stack in this environment.");
            return t;
          }),
          getInstance: s(function () {
            return new (this.getClass())();
          }),
        };
      },
      77862: (t, e, r) => {
        var n = r(50452),
          i = r(59134),
          o = r(17514).cache,
          s = r(79831);
        t.exports = function () {
          return (
            (Error.captureStackTrace = function t(e, r) {
              var a = [t];
              r && a.push(r);
              var c = n.getInstance().captureFrameStrings(a);
              Object.defineProperties(e, {
                stack: {
                  configurable: !0,
                  get: o(function () {
                    var t = i.getInstance().getFrames(c.frameStrings, c.functionValues);
                    return (Error.prepareStackTrace || s)(e, t, undefined);
                  }),
                },
                cachedStack: {
                  configurable: !0,
                  writable: !0,
                  enumerable: !1,
                  value: !0,
                },
              });
            }),
            (Error.getStackTrace = function (t) {
              if (t.cachedStack) return t.stack;
              var e,
                r = n.getInstance().getFrameStrings(t),
                o = [];
              r
                ? (o = i.getInstance().getFrames(r, []))
                : (e = ["The stack is not readable by unthrown errors in this environment."]);
              var a = (Error.prepareStackTrace || s)(t, o, e);
              if (r)
                try {
                  Object.defineProperties(t, {
                    stack: {
                      configurable: !0,
                      writable: !0,
                      enumerable: !1,
                      value: a,
                    },
                    cachedStack: {
                      configurable: !0,
                      writable: !0,
                      enumerable: !1,
                      value: !0,
                    },
                  });
                } catch (t) {}
              return a;
            }),
            {
              prepareStackTrace: s,
            }
          );
        };
      },
      79831: (t) => {
        t.exports = function (t, e, r) {
          var n = "";
          if (((n += t.name || "Error"), (n += ": " + (t.message || "")), r instanceof Array))
            for (var i in r) {
              n += "\n   # " + r[i];
            }
          for (var o in e) {
            n += "\n   at " + e[o].toString();
          }
          return n;
        };
      },
      86688: (t, e, r) => {
        var n = r(17514).cache,
          i = r(79831);
        t.exports = function () {
          return (
            (Error.captureStackTrace = function (t, e) {
              Object.defineProperties(t, {
                stack: {
                  configurable: !0,
                  get: n(function () {
                    return (Error.prepareStackTrace || i)(t, []);
                  }),
                },
                cachedStack: {
                  configurable: !0,
                  writable: !0,
                  enumerable: !1,
                  value: !0,
                },
              });
            }),
            (Error.getStackTrace = function (t) {
              if (t.cachedStack) return t.stack;
              var e = (Error.prepareStackTrace || i)(t, []);
              try {
                Object.defineProperties(t, {
                  stack: {
                    configurable: !0,
                    writable: !0,
                    enumerable: !1,
                    value: e,
                  },
                  cachedStack: {
                    configurable: !0,
                    writable: !0,
                    enumerable: !1,
                    value: !0,
                  },
                });
              } catch (t) {}
              return e;
            }),
            {
              prepareStackTrace: i,
            }
          );
        };
      },
      84649: (t, e, r) => {
        var n = r(79831);
        t.exports = function () {
          return (
            (Error.getStackTrace = function (t) {
              return t.stack;
            }),
            {
              prepareStackTrace: n,
            }
          );
        };
      },
      80645: (t, e) => {
        /*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
        (e.read = function (t, e, r, n, i) {
          var o,
            s,
            a = 8 * i - n - 1,
            c = (1 << a) - 1,
            u = c >> 1,
            h = -7,
            l = r ? i - 1 : 0,
            f = r ? -1 : 1,
            d = t[e + l];
          for (
            l += f, o = d & ((1 << -h) - 1), d >>= -h, h += a;
            h > 0;
            o = 256 * o + t[e + l], l += f, h -= 8
          );
          for (
            s = o & ((1 << -h) - 1), o >>= -h, h += n;
            h > 0;
            s = 256 * s + t[e + l], l += f, h -= 8
          );
          if (0 === o) o = 1 - u;
          else {
            if (o === c) return s ? NaN : (1 / 0) * (d ? -1 : 1);
            (s += Math.pow(2, n)), (o -= u);
          }
          return (d ? -1 : 1) * s * Math.pow(2, o - n);
        }),
          (e.write = function (t, e, r, n, i, o) {
            var s,
              a,
              c,
              u = 8 * o - i - 1,
              h = (1 << u) - 1,
              l = h >> 1,
              f = 23 === i ? Math.pow(2, -24) - Math.pow(2, -77) : 0,
              d = n ? 0 : o - 1,
              p = n ? 1 : -1,
              y = e < 0 || (0 === e && 1 / e < 0) ? 1 : 0;
            for (
              e = Math.abs(e),
                isNaN(e) || e === 1 / 0
                  ? ((a = isNaN(e) ? 1 : 0), (s = h))
                  : ((s = Math.floor(Math.log(e) / Math.LN2)),
                    e * (c = Math.pow(2, -s)) < 1 && (s--, (c *= 2)),
                    (e += s + l >= 1 ? f / c : f * Math.pow(2, 1 - l)) * c >= 2 && (s++, (c /= 2)),
                    s + l >= h
                      ? ((a = 0), (s = h))
                      : s + l >= 1
                        ? ((a = (e * c - 1) * Math.pow(2, i)), (s += l))
                        : ((a = e * Math.pow(2, l - 1) * Math.pow(2, i)), (s = 0)));
              i >= 8;
              t[r + d] = 255 & a, d += p, a /= 256, i -= 8
            );
            for (s = (s << i) | a, u += i; u > 0; t[r + d] = 255 & s, d += p, s /= 256, u -= 8);
            t[r + d - p] |= 128 * y;
          });
      },
      35717: (t) => {
        "function" == typeof Object.create
          ? (t.exports = function (t, e) {
              e &&
                ((t.super_ = e),
                (t.prototype = Object.create(e.prototype, {
                  constructor: {
                    value: t,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0,
                  },
                })));
            })
          : (t.exports = function (t, e) {
              if (e) {
                t.super_ = e;
                var r = function () {};
                (r.prototype = e.prototype), (t.prototype = new r()), (t.prototype.constructor = t);
              }
            });
      },
      72023: (module, exports, __webpack_require__) => {
        var process = __webpack_require__(34155),
          __WEBPACK_AMD_DEFINE_RESULT__;
        /**
         * [js-sha256]{@link https://github.com/emn178/js-sha256}
         *
         * @version 0.9.0
         * @author Chen, Yi-Cyuan [emn178@gmail.com]
         * @copyright Chen, Yi-Cyuan 2014-2017
         * @license MIT
         */
        (function () {
          var ERROR = "input is invalid type",
            WINDOW = "object" == typeof window,
            root = WINDOW ? window : {};
          root.JS_SHA256_NO_WINDOW && (WINDOW = !1);
          var WEB_WORKER = !WINDOW && "object" == typeof self,
            NODE_JS =
              !root.JS_SHA256_NO_NODE_JS &&
              "object" == typeof process &&
              process.versions &&
              process.versions.node;
          NODE_JS ? (root = __webpack_require__.g) : WEB_WORKER && (root = self);
          var COMMON_JS = !root.JS_SHA256_NO_COMMON_JS && module.exports,
            AMD = __webpack_require__.amdO,
            ARRAY_BUFFER = !root.JS_SHA256_NO_ARRAY_BUFFER && "undefined" != typeof ArrayBuffer,
            HEX_CHARS = "0123456789abcdef".split(""),
            EXTRA = [-2147483648, 8388608, 32768, 128],
            SHIFT = [24, 16, 8, 0],
            K = [
              1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748,
              2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206,
              2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983,
              1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671,
              3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372,
              1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411,
              3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734,
              506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779,
              1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479,
              3329325298,
            ],
            OUTPUT_TYPES = ["hex", "array", "digest", "arrayBuffer"],
            blocks = [];
          (!root.JS_SHA256_NO_NODE_JS && Array.isArray) ||
            (Array.isArray = function (t) {
              return "[object Array]" === Object.prototype.toString.call(t);
            }),
            !ARRAY_BUFFER ||
              (!root.JS_SHA256_NO_ARRAY_BUFFER_IS_VIEW && ArrayBuffer.isView) ||
              (ArrayBuffer.isView = function (t) {
                return "object" == typeof t && t.buffer && t.buffer.constructor === ArrayBuffer;
              });
          var createOutputMethod = function (t, e) {
              return function (r) {
                return new Sha256(e, !0).update(r)[t]();
              };
            },
            createMethod = function (t) {
              var e = createOutputMethod("hex", t);
              NODE_JS && (e = nodeWrap(e, t)),
                (e.create = function () {
                  return new Sha256(t);
                }),
                (e.update = function (t) {
                  return e.create().update(t);
                });
              for (var r = 0; r < OUTPUT_TYPES.length; ++r) {
                var n = OUTPUT_TYPES[r];
                e[n] = createOutputMethod(n, t);
              }
              return e;
            },
            nodeWrap = function (method, is224) {
              var crypto = eval("require('crypto')"),
                Buffer = eval("require('buffer').Buffer"),
                algorithm = is224 ? "sha224" : "sha256",
                nodeMethod = function (t) {
                  if ("string" == typeof t)
                    return crypto.createHash(algorithm).update(t, "utf8").digest("hex");
                  if (null == t) throw new Error(ERROR);
                  return (
                    t.constructor === ArrayBuffer && (t = new Uint8Array(t)),
                    Array.isArray(t) || ArrayBuffer.isView(t) || t.constructor === Buffer
                      ? crypto.createHash(algorithm).update(new Buffer(t)).digest("hex")
                      : method(t)
                  );
                };
              return nodeMethod;
            },
            createHmacOutputMethod = function (t, e) {
              return function (r, n) {
                return new HmacSha256(r, e, !0).update(n)[t]();
              };
            },
            createHmacMethod = function (t) {
              var e = createHmacOutputMethod("hex", t);
              (e.create = function (e) {
                return new HmacSha256(e, t);
              }),
                (e.update = function (t, r) {
                  return e.create(t).update(r);
                });
              for (var r = 0; r < OUTPUT_TYPES.length; ++r) {
                var n = OUTPUT_TYPES[r];
                e[n] = createHmacOutputMethod(n, t);
              }
              return e;
            };

          function Sha256(t, e) {
            e
              ? ((blocks[0] =
                  blocks[16] =
                  blocks[1] =
                  blocks[2] =
                  blocks[3] =
                  blocks[4] =
                  blocks[5] =
                  blocks[6] =
                  blocks[7] =
                  blocks[8] =
                  blocks[9] =
                  blocks[10] =
                  blocks[11] =
                  blocks[12] =
                  blocks[13] =
                  blocks[14] =
                  blocks[15] =
                    0),
                (this.blocks = blocks))
              : (this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
              t
                ? ((this.h0 = 3238371032),
                  (this.h1 = 914150663),
                  (this.h2 = 812702999),
                  (this.h3 = 4144912697),
                  (this.h4 = 4290775857),
                  (this.h5 = 1750603025),
                  (this.h6 = 1694076839),
                  (this.h7 = 3204075428))
                : ((this.h0 = 1779033703),
                  (this.h1 = 3144134277),
                  (this.h2 = 1013904242),
                  (this.h3 = 2773480762),
                  (this.h4 = 1359893119),
                  (this.h5 = 2600822924),
                  (this.h6 = 528734635),
                  (this.h7 = 1541459225)),
              (this.block = this.start = this.bytes = this.hBytes = 0),
              (this.finalized = this.hashed = !1),
              (this.first = !0),
              (this.is224 = t);
          }

          function HmacSha256(t, e, r) {
            var n,
              i = typeof t;
            if ("string" === i) {
              var o,
                s = [],
                a = t.length,
                c = 0;
              for (n = 0; n < a; ++n)
                (o = t.charCodeAt(n)) < 128
                  ? (s[c++] = o)
                  : o < 2048
                    ? ((s[c++] = 192 | (o >> 6)), (s[c++] = 128 | (63 & o)))
                    : o < 55296 || o >= 57344
                      ? ((s[c++] = 224 | (o >> 12)),
                        (s[c++] = 128 | ((o >> 6) & 63)),
                        (s[c++] = 128 | (63 & o)))
                      : ((o = 65536 + (((1023 & o) << 10) | (1023 & t.charCodeAt(++n)))),
                        (s[c++] = 240 | (o >> 18)),
                        (s[c++] = 128 | ((o >> 12) & 63)),
                        (s[c++] = 128 | ((o >> 6) & 63)),
                        (s[c++] = 128 | (63 & o)));
              t = s;
            } else {
              if ("object" !== i) throw new Error(ERROR);
              if (null === t) throw new Error(ERROR);
              if (ARRAY_BUFFER && t.constructor === ArrayBuffer) t = new Uint8Array(t);
              else if (!(Array.isArray(t) || (ARRAY_BUFFER && ArrayBuffer.isView(t))))
                throw new Error(ERROR);
            }
            t.length > 64 && (t = new Sha256(e, !0).update(t).array());
            var u = [],
              h = [];
            for (n = 0; n < 64; ++n) {
              var l = t[n] || 0;
              (u[n] = 92 ^ l), (h[n] = 54 ^ l);
            }
            Sha256.call(this, e, r),
              this.update(h),
              (this.oKeyPad = u),
              (this.inner = !0),
              (this.sharedMemory = r);
          }
          (Sha256.prototype.update = function (t) {
            if (!this.finalized) {
              var e,
                r = typeof t;
              if ("string" !== r) {
                if ("object" !== r) throw new Error(ERROR);
                if (null === t) throw new Error(ERROR);
                if (ARRAY_BUFFER && t.constructor === ArrayBuffer) t = new Uint8Array(t);
                else if (!(Array.isArray(t) || (ARRAY_BUFFER && ArrayBuffer.isView(t))))
                  throw new Error(ERROR);
                e = !0;
              }
              for (var n, i, o = 0, s = t.length, a = this.blocks; o < s; ) {
                if (
                  (this.hashed &&
                    ((this.hashed = !1),
                    (a[0] = this.block),
                    (a[16] =
                      a[1] =
                      a[2] =
                      a[3] =
                      a[4] =
                      a[5] =
                      a[6] =
                      a[7] =
                      a[8] =
                      a[9] =
                      a[10] =
                      a[11] =
                      a[12] =
                      a[13] =
                      a[14] =
                      a[15] =
                        0)),
                  e)
                )
                  for (i = this.start; o < s && i < 64; ++o) a[i >> 2] |= t[o] << SHIFT[3 & i++];
                else
                  for (i = this.start; o < s && i < 64; ++o)
                    (n = t.charCodeAt(o)) < 128
                      ? (a[i >> 2] |= n << SHIFT[3 & i++])
                      : n < 2048
                        ? ((a[i >> 2] |= (192 | (n >> 6)) << SHIFT[3 & i++]),
                          (a[i >> 2] |= (128 | (63 & n)) << SHIFT[3 & i++]))
                        : n < 55296 || n >= 57344
                          ? ((a[i >> 2] |= (224 | (n >> 12)) << SHIFT[3 & i++]),
                            (a[i >> 2] |= (128 | ((n >> 6) & 63)) << SHIFT[3 & i++]),
                            (a[i >> 2] |= (128 | (63 & n)) << SHIFT[3 & i++]))
                          : ((n = 65536 + (((1023 & n) << 10) | (1023 & t.charCodeAt(++o)))),
                            (a[i >> 2] |= (240 | (n >> 18)) << SHIFT[3 & i++]),
                            (a[i >> 2] |= (128 | ((n >> 12) & 63)) << SHIFT[3 & i++]),
                            (a[i >> 2] |= (128 | ((n >> 6) & 63)) << SHIFT[3 & i++]),
                            (a[i >> 2] |= (128 | (63 & n)) << SHIFT[3 & i++]));
                (this.lastByteIndex = i),
                  (this.bytes += i - this.start),
                  i >= 64
                    ? ((this.block = a[16]), (this.start = i - 64), this.hash(), (this.hashed = !0))
                    : (this.start = i);
              }
              return (
                this.bytes > 4294967295 &&
                  ((this.hBytes += (this.bytes / 4294967296) << 0),
                  (this.bytes = this.bytes % 4294967296)),
                this
              );
            }
          }),
            (Sha256.prototype.finalize = function () {
              if (!this.finalized) {
                this.finalized = !0;
                var t = this.blocks,
                  e = this.lastByteIndex;
                (t[16] = this.block),
                  (t[e >> 2] |= EXTRA[3 & e]),
                  (this.block = t[16]),
                  e >= 56 &&
                    (this.hashed || this.hash(),
                    (t[0] = this.block),
                    (t[16] =
                      t[1] =
                      t[2] =
                      t[3] =
                      t[4] =
                      t[5] =
                      t[6] =
                      t[7] =
                      t[8] =
                      t[9] =
                      t[10] =
                      t[11] =
                      t[12] =
                      t[13] =
                      t[14] =
                      t[15] =
                        0)),
                  (t[14] = (this.hBytes << 3) | (this.bytes >>> 29)),
                  (t[15] = this.bytes << 3),
                  this.hash();
              }
            }),
            (Sha256.prototype.hash = function () {
              var t,
                e,
                r,
                n,
                i,
                o,
                s,
                a,
                c,
                u = this.h0,
                h = this.h1,
                l = this.h2,
                f = this.h3,
                d = this.h4,
                p = this.h5,
                y = this.h6,
                m = this.h7,
                g = this.blocks;
              for (t = 16; t < 64; ++t)
                (e = (((i = g[t - 15]) >>> 7) | (i << 25)) ^ ((i >>> 18) | (i << 14)) ^ (i >>> 3)),
                  (r =
                    (((i = g[t - 2]) >>> 17) | (i << 15)) ^ ((i >>> 19) | (i << 13)) ^ (i >>> 10)),
                  (g[t] = (g[t - 16] + e + g[t - 7] + r) << 0);
              for (c = h & l, t = 0; t < 64; t += 4)
                this.first
                  ? (this.is224
                      ? ((o = 300032),
                        (m = ((i = g[0] - 1413257819) - 150054599) << 0),
                        (f = (i + 24177077) << 0))
                      : ((o = 704751109),
                        (m = ((i = g[0] - 210244248) - 1521486534) << 0),
                        (f = (i + 143694565) << 0)),
                    (this.first = !1))
                  : ((e =
                      ((u >>> 2) | (u << 30)) ^
                      ((u >>> 13) | (u << 19)) ^
                      ((u >>> 22) | (u << 10))),
                    (n = (o = u & h) ^ (u & l) ^ c),
                    (m =
                      (f +
                        (i =
                          m +
                          (r =
                            ((d >>> 6) | (d << 26)) ^
                            ((d >>> 11) | (d << 21)) ^
                            ((d >>> 25) | (d << 7))) +
                          ((d & p) ^ (~d & y)) +
                          K[t] +
                          g[t])) <<
                      0),
                    (f = (i + (e + n)) << 0)),
                  (e =
                    ((f >>> 2) | (f << 30)) ^ ((f >>> 13) | (f << 19)) ^ ((f >>> 22) | (f << 10))),
                  (n = (s = f & u) ^ (f & h) ^ o),
                  (y =
                    (l +
                      (i =
                        y +
                        (r =
                          ((m >>> 6) | (m << 26)) ^
                          ((m >>> 11) | (m << 21)) ^
                          ((m >>> 25) | (m << 7))) +
                        ((m & d) ^ (~m & p)) +
                        K[t + 1] +
                        g[t + 1])) <<
                    0),
                  (e =
                    (((l = (i + (e + n)) << 0) >>> 2) | (l << 30)) ^
                    ((l >>> 13) | (l << 19)) ^
                    ((l >>> 22) | (l << 10))),
                  (n = (a = l & f) ^ (l & u) ^ s),
                  (p =
                    (h +
                      (i =
                        p +
                        (r =
                          ((y >>> 6) | (y << 26)) ^
                          ((y >>> 11) | (y << 21)) ^
                          ((y >>> 25) | (y << 7))) +
                        ((y & m) ^ (~y & d)) +
                        K[t + 2] +
                        g[t + 2])) <<
                    0),
                  (e =
                    (((h = (i + (e + n)) << 0) >>> 2) | (h << 30)) ^
                    ((h >>> 13) | (h << 19)) ^
                    ((h >>> 22) | (h << 10))),
                  (n = (c = h & l) ^ (h & f) ^ a),
                  (d =
                    (u +
                      (i =
                        d +
                        (r =
                          ((p >>> 6) | (p << 26)) ^
                          ((p >>> 11) | (p << 21)) ^
                          ((p >>> 25) | (p << 7))) +
                        ((p & y) ^ (~p & m)) +
                        K[t + 3] +
                        g[t + 3])) <<
                    0),
                  (u = (i + (e + n)) << 0);
              (this.h0 = (this.h0 + u) << 0),
                (this.h1 = (this.h1 + h) << 0),
                (this.h2 = (this.h2 + l) << 0),
                (this.h3 = (this.h3 + f) << 0),
                (this.h4 = (this.h4 + d) << 0),
                (this.h5 = (this.h5 + p) << 0),
                (this.h6 = (this.h6 + y) << 0),
                (this.h7 = (this.h7 + m) << 0);
            }),
            (Sha256.prototype.hex = function () {
              this.finalize();
              var t = this.h0,
                e = this.h1,
                r = this.h2,
                n = this.h3,
                i = this.h4,
                o = this.h5,
                s = this.h6,
                a = this.h7,
                c =
                  HEX_CHARS[(t >> 28) & 15] +
                  HEX_CHARS[(t >> 24) & 15] +
                  HEX_CHARS[(t >> 20) & 15] +
                  HEX_CHARS[(t >> 16) & 15] +
                  HEX_CHARS[(t >> 12) & 15] +
                  HEX_CHARS[(t >> 8) & 15] +
                  HEX_CHARS[(t >> 4) & 15] +
                  HEX_CHARS[15 & t] +
                  HEX_CHARS[(e >> 28) & 15] +
                  HEX_CHARS[(e >> 24) & 15] +
                  HEX_CHARS[(e >> 20) & 15] +
                  HEX_CHARS[(e >> 16) & 15] +
                  HEX_CHARS[(e >> 12) & 15] +
                  HEX_CHARS[(e >> 8) & 15] +
                  HEX_CHARS[(e >> 4) & 15] +
                  HEX_CHARS[15 & e] +
                  HEX_CHARS[(r >> 28) & 15] +
                  HEX_CHARS[(r >> 24) & 15] +
                  HEX_CHARS[(r >> 20) & 15] +
                  HEX_CHARS[(r >> 16) & 15] +
                  HEX_CHARS[(r >> 12) & 15] +
                  HEX_CHARS[(r >> 8) & 15] +
                  HEX_CHARS[(r >> 4) & 15] +
                  HEX_CHARS[15 & r] +
                  HEX_CHARS[(n >> 28) & 15] +
                  HEX_CHARS[(n >> 24) & 15] +
                  HEX_CHARS[(n >> 20) & 15] +
                  HEX_CHARS[(n >> 16) & 15] +
                  HEX_CHARS[(n >> 12) & 15] +
                  HEX_CHARS[(n >> 8) & 15] +
                  HEX_CHARS[(n >> 4) & 15] +
                  HEX_CHARS[15 & n] +
                  HEX_CHARS[(i >> 28) & 15] +
                  HEX_CHARS[(i >> 24) & 15] +
                  HEX_CHARS[(i >> 20) & 15] +
                  HEX_CHARS[(i >> 16) & 15] +
                  HEX_CHARS[(i >> 12) & 15] +
                  HEX_CHARS[(i >> 8) & 15] +
                  HEX_CHARS[(i >> 4) & 15] +
                  HEX_CHARS[15 & i] +
                  HEX_CHARS[(o >> 28) & 15] +
                  HEX_CHARS[(o >> 24) & 15] +
                  HEX_CHARS[(o >> 20) & 15] +
                  HEX_CHARS[(o >> 16) & 15] +
                  HEX_CHARS[(o >> 12) & 15] +
                  HEX_CHARS[(o >> 8) & 15] +
                  HEX_CHARS[(o >> 4) & 15] +
                  HEX_CHARS[15 & o] +
                  HEX_CHARS[(s >> 28) & 15] +
                  HEX_CHARS[(s >> 24) & 15] +
                  HEX_CHARS[(s >> 20) & 15] +
                  HEX_CHARS[(s >> 16) & 15] +
                  HEX_CHARS[(s >> 12) & 15] +
                  HEX_CHARS[(s >> 8) & 15] +
                  HEX_CHARS[(s >> 4) & 15] +
                  HEX_CHARS[15 & s];
              return (
                this.is224 ||
                  (c +=
                    HEX_CHARS[(a >> 28) & 15] +
                    HEX_CHARS[(a >> 24) & 15] +
                    HEX_CHARS[(a >> 20) & 15] +
                    HEX_CHARS[(a >> 16) & 15] +
                    HEX_CHARS[(a >> 12) & 15] +
                    HEX_CHARS[(a >> 8) & 15] +
                    HEX_CHARS[(a >> 4) & 15] +
                    HEX_CHARS[15 & a]),
                c
              );
            }),
            (Sha256.prototype.toString = Sha256.prototype.hex),
            (Sha256.prototype.digest = function () {
              this.finalize();
              var t = this.h0,
                e = this.h1,
                r = this.h2,
                n = this.h3,
                i = this.h4,
                o = this.h5,
                s = this.h6,
                a = this.h7,
                c = [
                  (t >> 24) & 255,
                  (t >> 16) & 255,
                  (t >> 8) & 255,
                  255 & t,
                  (e >> 24) & 255,
                  (e >> 16) & 255,
                  (e >> 8) & 255,
                  255 & e,
                  (r >> 24) & 255,
                  (r >> 16) & 255,
                  (r >> 8) & 255,
                  255 & r,
                  (n >> 24) & 255,
                  (n >> 16) & 255,
                  (n >> 8) & 255,
                  255 & n,
                  (i >> 24) & 255,
                  (i >> 16) & 255,
                  (i >> 8) & 255,
                  255 & i,
                  (o >> 24) & 255,
                  (o >> 16) & 255,
                  (o >> 8) & 255,
                  255 & o,
                  (s >> 24) & 255,
                  (s >> 16) & 255,
                  (s >> 8) & 255,
                  255 & s,
                ];
              return (
                this.is224 || c.push((a >> 24) & 255, (a >> 16) & 255, (a >> 8) & 255, 255 & a), c
              );
            }),
            (Sha256.prototype.array = Sha256.prototype.digest),
            (Sha256.prototype.arrayBuffer = function () {
              this.finalize();
              var t = new ArrayBuffer(this.is224 ? 28 : 32),
                e = new DataView(t);
              return (
                e.setUint32(0, this.h0),
                e.setUint32(4, this.h1),
                e.setUint32(8, this.h2),
                e.setUint32(12, this.h3),
                e.setUint32(16, this.h4),
                e.setUint32(20, this.h5),
                e.setUint32(24, this.h6),
                this.is224 || e.setUint32(28, this.h7),
                t
              );
            }),
            (HmacSha256.prototype = new Sha256()),
            (HmacSha256.prototype.finalize = function () {
              if ((Sha256.prototype.finalize.call(this), this.inner)) {
                this.inner = !1;
                var t = this.array();
                Sha256.call(this, this.is224, this.sharedMemory),
                  this.update(this.oKeyPad),
                  this.update(t),
                  Sha256.prototype.finalize.call(this);
              }
            });
          var exports = createMethod();
          (exports.sha256 = exports),
            (exports.sha224 = createMethod(!0)),
            (exports.sha256.hmac = createHmacMethod()),
            (exports.sha224.hmac = createHmacMethod(!0)),
            COMMON_JS
              ? (module.exports = exports)
              : ((root.sha256 = exports.sha256),
                (root.sha224 = exports.sha224),
                AMD &&
                  ((__WEBPACK_AMD_DEFINE_RESULT__ = function () {
                    return exports;
                  }.call(exports, __webpack_require__, exports, module)),
                  void 0 === __WEBPACK_AMD_DEFINE_RESULT__ ||
                    (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)));
        })();
      },
      466: function (t) {
        t.exports = (function () {
          /*!
           * mustache.js - Logic-less {{mustache}} templates with JavaScript
           * http://github.com/janl/mustache.js
           */
          var t = Object.prototype.toString,
            e =
              Array.isArray ||
              function (e) {
                return "[object Array]" === t.call(e);
              };

          function r(t) {
            return "function" == typeof t;
          }

          function n(t) {
            return e(t) ? "array" : typeof t;
          }

          function i(t) {
            return t.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
          }

          function o(t, e) {
            return null != t && "object" == typeof t && e in t;
          }

          function s(t, e) {
            return null != t && "object" != typeof t && t.hasOwnProperty && t.hasOwnProperty(e);
          }
          var a = RegExp.prototype.test;

          function c(t, e) {
            return a.call(t, e);
          }
          var u = /\S/;

          function h(t) {
            return !c(u, t);
          }
          var l = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
            "/": "&#x2F;",
            "`": "&#x60;",
            "=": "&#x3D;",
          };

          function f(t) {
            return String(t).replace(/[&<>"'`=\/]/g, function (t) {
              return l[t];
            });
          }
          var d = /\s*/,
            p = /\s+/,
            y = /\s*=/,
            m = /\s*\}/,
            g = /#|\^|\/|>|\{|&|=|!/;

          function w(t, r) {
            if (!t) return [];
            var n,
              o,
              s,
              a = !1,
              c = [],
              u = [],
              l = [],
              f = !1,
              w = !1,
              E = "",
              A = 0;

            function S() {
              if (f && !w) while (l.length) delete u[l.pop()];
              else l = [];
              (f = !1), (w = !1);
            }

            function I(t) {
              if (("string" == typeof t && (t = t.split(p, 2)), !e(t) || 2 !== t.length))
                throw new Error("Invalid tags: " + t);
              (n = new RegExp(i(t[0]) + "\\s*")),
                (o = new RegExp("\\s*" + i(t[1]))),
                (s = new RegExp("\\s*" + i("}" + t[1])));
            }
            I(r || M.tags);
            for (var k, x, T, O, C, R, P = new _(t); !P.eos(); ) {
              if (((k = P.pos), (T = P.scanUntil(n))))
                for (var N = 0, U = T.length; N < U; ++N)
                  h((O = T.charAt(N)))
                    ? (l.push(u.length), (E += O))
                    : ((w = !0), (a = !0), (E += " ")),
                    u.push(["text", O, k, k + 1]),
                    (k += 1),
                    "\n" === O && (S(), (E = ""), (A = 0), (a = !1));
              if (!P.scan(n)) break;
              if (
                ((f = !0),
                (x = P.scan(g) || "name"),
                P.scan(d),
                "=" === x
                  ? ((T = P.scanUntil(y)), P.scan(y), P.scanUntil(o))
                  : "{" === x
                    ? ((T = P.scanUntil(s)), P.scan(m), P.scanUntil(o), (x = "&"))
                    : (T = P.scanUntil(o)),
                !P.scan(o))
              )
                throw new Error("Unclosed tag at " + P.pos);
              if (
                ((C = ">" == x ? [x, T, k, P.pos, E, A, a] : [x, T, k, P.pos]),
                A++,
                u.push(C),
                "#" === x || "^" === x)
              )
                c.push(C);
              else if ("/" === x) {
                if (!(R = c.pop())) throw new Error('Unopened section "' + T + '" at ' + k);
                if (R[1] !== T) throw new Error('Unclosed section "' + R[1] + '" at ' + k);
              } else "name" === x || "{" === x || "&" === x ? (w = !0) : "=" === x && I(T);
            }
            if ((S(), (R = c.pop())))
              throw new Error('Unclosed section "' + R[1] + '" at ' + P.pos);
            return b(v(u));
          }

          function v(t) {
            for (var e, r, n = [], i = 0, o = t.length; i < o; ++i)
              (e = t[i]) &&
                ("text" === e[0] && r && "text" === r[0]
                  ? ((r[1] += e[1]), (r[3] = e[3]))
                  : (n.push(e), (r = e)));
            return n;
          }

          function b(t) {
            for (var e, r = [], n = r, i = [], o = 0, s = t.length; o < s; ++o)
              switch ((e = t[o])[0]) {
                case "#":
                case "^":
                  n.push(e), i.push(e), (n = e[4] = []);
                  break;
                case "/":
                  (i.pop()[5] = e[2]), (n = i.length > 0 ? i[i.length - 1][4] : r);
                  break;
                default:
                  n.push(e);
              }
            return r;
          }

          function _(t) {
            (this.string = t), (this.tail = t), (this.pos = 0);
          }

          function E(t, e) {
            (this.view = t),
              (this.cache = {
                ".": this.view,
              }),
              (this.parent = e);
          }

          function A() {
            this.templateCache = {
              _cache: {},
              set: function (t, e) {
                this._cache[t] = e;
              },
              get: function (t) {
                return this._cache[t];
              },
              clear: function () {
                this._cache = {};
              },
            };
          }
          (_.prototype.eos = function () {
            return "" === this.tail;
          }),
            (_.prototype.scan = function (t) {
              var e = this.tail.match(t);
              if (!e || 0 !== e.index) return "";
              var r = e[0];
              return (this.tail = this.tail.substring(r.length)), (this.pos += r.length), r;
            }),
            (_.prototype.scanUntil = function (t) {
              var e,
                r = this.tail.search(t);
              switch (r) {
                case -1:
                  (e = this.tail), (this.tail = "");
                  break;
                case 0:
                  e = "";
                  break;
                default:
                  (e = this.tail.substring(0, r)), (this.tail = this.tail.substring(r));
              }
              return (this.pos += e.length), e;
            }),
            (E.prototype.push = function (t) {
              return new E(t, this);
            }),
            (E.prototype.lookup = function (t) {
              var e,
                n = this.cache;
              if (n.hasOwnProperty(t)) e = n[t];
              else {
                for (var i, a, c, u = this, h = !1; u; ) {
                  if (t.indexOf(".") > 0)
                    for (i = u.view, a = t.split("."), c = 0; null != i && c < a.length; )
                      c === a.length - 1 && (h = o(i, a[c]) || s(i, a[c])), (i = i[a[c++]]);
                  else (i = u.view[t]), (h = o(u.view, t));
                  if (h) {
                    e = i;
                    break;
                  }
                  u = u.parent;
                }
                n[t] = e;
              }
              return r(e) && (e = e.call(this.view)), e;
            }),
            (A.prototype.clearCache = function () {
              void 0 !== this.templateCache && this.templateCache.clear();
            }),
            (A.prototype.parse = function (t, e) {
              var r = this.templateCache,
                n = t + ":" + (e || M.tags).join(":"),
                i = void 0 !== r,
                o = i ? r.get(n) : void 0;
              return null == o && ((o = w(t, e)), i && r.set(n, o)), o;
            }),
            (A.prototype.render = function (t, e, r, n) {
              var i = this.getConfigTags(n),
                o = this.parse(t, i),
                s = e instanceof E ? e : new E(e, void 0);
              return this.renderTokens(o, s, r, t, n);
            }),
            (A.prototype.renderTokens = function (t, e, r, n, i) {
              for (var o, s, a, c = "", u = 0, h = t.length; u < h; ++u)
                (a = void 0),
                  "#" === (s = (o = t[u])[0])
                    ? (a = this.renderSection(o, e, r, n, i))
                    : "^" === s
                      ? (a = this.renderInverted(o, e, r, n, i))
                      : ">" === s
                        ? (a = this.renderPartial(o, e, r, i))
                        : "&" === s
                          ? (a = this.unescapedValue(o, e))
                          : "name" === s
                            ? (a = this.escapedValue(o, e, i))
                            : "text" === s && (a = this.rawValue(o)),
                  void 0 !== a && (c += a);
              return c;
            }),
            (A.prototype.renderSection = function (t, n, i, o, s) {
              var a = this,
                c = "",
                u = n.lookup(t[1]);

              function h(t) {
                return a.render(t, n, i, s);
              }
              if (u) {
                if (e(u))
                  for (var l = 0, f = u.length; l < f; ++l)
                    c += this.renderTokens(t[4], n.push(u[l]), i, o, s);
                else if ("object" == typeof u || "string" == typeof u || "number" == typeof u)
                  c += this.renderTokens(t[4], n.push(u), i, o, s);
                else if (r(u)) {
                  if ("string" != typeof o)
                    throw new Error(
                      "Cannot use higher-order sections without the original template",
                    );
                  null != (u = u.call(n.view, o.slice(t[3], t[5]), h)) && (c += u);
                } else c += this.renderTokens(t[4], n, i, o, s);
                return c;
              }
            }),
            (A.prototype.renderInverted = function (t, r, n, i, o) {
              var s = r.lookup(t[1]);
              if (!s || (e(s) && 0 === s.length)) return this.renderTokens(t[4], r, n, i, o);
            }),
            (A.prototype.indentPartial = function (t, e, r) {
              for (var n = e.replace(/[^ \t]/g, ""), i = t.split("\n"), o = 0; o < i.length; o++)
                i[o].length && (o > 0 || !r) && (i[o] = n + i[o]);
              return i.join("\n");
            }),
            (A.prototype.renderPartial = function (t, e, n, i) {
              if (n) {
                var o = this.getConfigTags(i),
                  s = r(n) ? n(t[1]) : n[t[1]];
                if (null != s) {
                  var a = t[6],
                    c = t[5],
                    u = t[4],
                    h = s;
                  0 == c && u && (h = this.indentPartial(s, u, a));
                  var l = this.parse(h, o);
                  return this.renderTokens(l, e, n, h, i);
                }
              }
            }),
            (A.prototype.unescapedValue = function (t, e) {
              var r = e.lookup(t[1]);
              if (null != r) return r;
            }),
            (A.prototype.escapedValue = function (t, e, r) {
              var n = this.getConfigEscape(r) || M.escape,
                i = e.lookup(t[1]);
              if (null != i) return "number" == typeof i && n === M.escape ? String(i) : n(i);
            }),
            (A.prototype.rawValue = function (t) {
              return t[1];
            }),
            (A.prototype.getConfigTags = function (t) {
              return e(t) ? t : t && "object" == typeof t ? t.tags : void 0;
            }),
            (A.prototype.getConfigEscape = function (t) {
              return t && "object" == typeof t && !e(t) ? t.escape : void 0;
            });
          var M = {
              name: "mustache.js",
              version: "4.2.0",
              tags: ["{{", "}}"],
              clearCache: void 0,
              escape: void 0,
              parse: void 0,
              render: void 0,
              Scanner: void 0,
              Context: void 0,
              Writer: void 0,
              set templateCache(t) {
                S.templateCache = t;
              },
              get templateCache() {
                return S.templateCache;
              },
            },
            S = new A();
          return (
            (M.clearCache = function () {
              return S.clearCache();
            }),
            (M.parse = function (t, e) {
              return S.parse(t, e);
            }),
            (M.render = function (t, e, r, i) {
              if ("string" != typeof t)
                throw new TypeError(
                  'Invalid template! Template should be a "string" but "' +
                    n(t) +
                    '" was given as the first argument for mustache#render(template, view, partials)',
                );
              return S.render(t, e, r, i);
            }),
            (M.escape = f),
            (M.Scanner = _),
            (M.Context = E),
            (M.Writer = A),
            M
          );
        })();
      },
      45180: function (t, e, r) {
        var n = r(48764).Buffer,
          i = r(34155),
          o =
            (this && this.__importDefault) ||
            function (t) {
              return t && t.__esModule
                ? t
                : {
                    default: t,
                  };
            };
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.Account = void 0);
        const s = o(r(13550)),
          a = o(r(83686)),
          c = r(49521),
          u = r(84920),
          h = r(25532),
          l = r(56393),
          f = r(44497),
          d = r(9743),
          p = r(24873),
          y = o(r(12707));

        function m(t) {
          return JSON.parse(n.from(t).toString());
        }

        function g(t) {
          return n.from(JSON.stringify(t));
        }
        class w {
          constructor(t, e) {
            (this.accessKeyByPublicKeyCache = {}), (this.connection = t), (this.accountId = e);
          }
          get ready() {
            return (
              a.default("Account.ready()")("not needed anymore, always ready"), Promise.resolve()
            );
          }
          async fetchState() {
            a.default("Account.fetchState()")("use `Account.state()` instead");
          }
          async state() {
            return this.connection.provider.query({
              request_type: "view_account",
              account_id: this.accountId,
              finality: "optimistic",
            });
          }
          printLogsAndFailures(t, e) {
            if (!i.env.NEAR_NO_LOGS)
              for (const r of e)
                console.log(
                  `Receipt${r.receiptIds.length > 1 ? "s" : ""}: ${r.receiptIds.join(", ")}`,
                ),
                  this.printLogs(t, r.logs, "\t"),
                  r.failure && console.warn(`\tFailure [${t}]: ${r.failure}`);
          }
          printLogs(t, e, r = "") {
            if (!i.env.NEAR_NO_LOGS) for (const n of e) console.log(`${r}Log [${t}]: ${n}`);
          }
          async signTransaction(t, e) {
            const r = await this.findAccessKey(t, e);
            if (!r)
              throw new u.TypedError(
                `Can not sign transactions for account ${this.accountId} on network ${this.connection.networkId}, no matching key pair found in ${this.connection.signer}.`,
                "KeyNotFound",
              );
            const { accessKey: n } = r,
              i = (
                await this.connection.provider.block({
                  finality: "final",
                })
              ).header.hash,
              o = ++n.nonce;
            return await c.signTransaction(
              t,
              o,
              e,
              h.baseDecode(i),
              this.connection.signer,
              this.accountId,
              this.connection.networkId,
            );
          }
          signAndSendTransaction(...t) {
            return "string" == typeof t[0]
              ? this.signAndSendTransactionV1(t[0], t[1])
              : this.signAndSendTransactionV2(t[0]);
          }
          signAndSendTransactionV1(t, e) {
            return (
              a.default("Account.signAndSendTransaction(receiverId, actions")(
                "use `Account.signAndSendTransaction(SignAndSendTransactionOptions)` instead",
              ),
              this.signAndSendTransactionV2({
                receiverId: t,
                actions: e,
              })
            );
          }
          async signAndSendTransactionV2({ receiverId: t, actions: e }) {
            let r, n;
            const i = await y.default(500, 12, 1.5, async () => {
              [r, n] = await this.signTransaction(t, e);
              const i = n.transaction.publicKey;
              try {
                return await this.connection.provider.sendTransaction(n);
              } catch (e) {
                if ("InvalidNonce" === e.type)
                  return (
                    f.logWarning(`Retrying transaction ${t}:${h.baseEncode(r)} with new nonce.`),
                    delete this.accessKeyByPublicKeyCache[i.toString()],
                    null
                  );
                if ("Expired" === e.type)
                  return (
                    f.logWarning(
                      `Retrying transaction ${t}:${h.baseEncode(r)} due to expired block hash`,
                    ),
                    null
                  );
                throw ((e.context = new u.ErrorContext(h.baseEncode(r))), e);
              }
            });
            if (!i)
              throw new u.TypedError(
                "nonce retries exceeded for transaction. This usually means there are too many parallel requests with the same access key.",
                "RetriesExceeded",
              );
            const o = [i.transaction_outcome, ...i.receipts_outcome].reduce(
              (t, e) =>
                e.outcome.logs.length ||
                ("object" == typeof e.outcome.status && "object" == typeof e.outcome.status.Failure)
                  ? t.concat({
                      receiptIds: e.outcome.receipt_ids,
                      logs: e.outcome.logs,
                      failure:
                        void 0 !== e.outcome.status.Failure
                          ? d.parseRpcError(e.outcome.status.Failure)
                          : null,
                    })
                  : t,
              [],
            );
            if (
              (this.printLogsAndFailures(n.transaction.receiverId, o),
              "object" == typeof i.status && "object" == typeof i.status.Failure)
            )
              throw i.status.Failure.error_message && i.status.Failure.error_type
                ? new u.TypedError(
                    `Transaction ${i.transaction_outcome.id} failed. ${i.status.Failure.error_message}`,
                    i.status.Failure.error_type,
                  )
                : d.parseResultError(i);
            return i;
          }
          async findAccessKey(t, e) {
            const r = await this.connection.signer.getPublicKey(
              this.accountId,
              this.connection.networkId,
            );
            if (!r) return null;
            const n = this.accessKeyByPublicKeyCache[r.toString()];
            if (void 0 !== n)
              return {
                publicKey: r,
                accessKey: n,
              };
            try {
              const t = await this.connection.provider.query({
                request_type: "view_access_key",
                account_id: this.accountId,
                public_key: r.toString(),
                finality: "optimistic",
              });
              return this.accessKeyByPublicKeyCache[r.toString()]
                ? {
                    publicKey: r,
                    accessKey: this.accessKeyByPublicKeyCache[r.toString()],
                  }
                : ((this.accessKeyByPublicKeyCache[r.toString()] = t),
                  {
                    publicKey: r,
                    accessKey: t,
                  });
            } catch (t) {
              if ("AccessKeyDoesNotExist" == t.type) return null;
              throw t;
            }
          }
          async createAndDeployContract(t, e, r, n) {
            const i = c.fullAccessKey();
            await this.signAndSendTransaction({
              receiverId: t,
              actions: [
                c.createAccount(),
                c.transfer(n),
                c.addKey(l.PublicKey.from(e), i),
                c.deployContract(r),
              ],
            });
            return new w(this.connection, t);
          }
          async sendMoney(t, e) {
            return this.signAndSendTransaction({
              receiverId: t,
              actions: [c.transfer(e)],
            });
          }
          async createAccount(t, e, r) {
            const n = c.fullAccessKey();
            return this.signAndSendTransaction({
              receiverId: t,
              actions: [c.createAccount(), c.transfer(r), c.addKey(l.PublicKey.from(e), n)],
            });
          }
          async deleteAccount(t) {
            return this.signAndSendTransaction({
              receiverId: this.accountId,
              actions: [c.deleteAccount(t)],
            });
          }
          async deployContract(t) {
            return this.signAndSendTransaction({
              receiverId: this.accountId,
              actions: [c.deployContract(t)],
            });
          }
          async functionCall(...t) {
            return "string" == typeof t[0]
              ? this.functionCallV1(t[0], t[1], t[2], t[3], t[4])
              : this.functionCallV2(t[0]);
          }
          functionCallV1(t, e, r, n, i) {
            return (
              a.default("Account.functionCall(contractId, methodName, args, gas, amount)")(
                "use `Account.functionCall(FunctionCallOptions)` instead",
              ),
              (r = r || {}),
              this.validateArgs(r),
              this.signAndSendTransaction({
                receiverId: t,
                actions: [c.functionCall(e, r, n || p.DEFAULT_FUNCTION_CALL_GAS, i)],
              })
            );
          }
          functionCallV2({
            contractId: t,
            methodName: e,
            args: r = {},
            gas: n = p.DEFAULT_FUNCTION_CALL_GAS,
            attachedDeposit: i,
            walletMeta: o,
            walletCallbackUrl: s,
            stringify: a,
          }) {
            this.validateArgs(r);
            const u = void 0 === a ? c.stringifyJsonOrBytes : a;
            return this.signAndSendTransaction({
              receiverId: t,
              actions: [c.functionCall(e, r, n, i, u)],
              walletMeta: o,
              walletCallbackUrl: s,
            });
          }
          async addKey(t, e, r, n) {
            let i;
            return (
              r || (r = []),
              Array.isArray(r) || (r = [r]),
              (i = e ? c.functionCallAccessKey(e, r, n) : c.fullAccessKey()),
              this.signAndSendTransaction({
                receiverId: this.accountId,
                actions: [c.addKey(l.PublicKey.from(t), i)],
              })
            );
          }
          async deleteKey(t) {
            return this.signAndSendTransaction({
              receiverId: this.accountId,
              actions: [c.deleteKey(l.PublicKey.from(t))],
            });
          }
          async stake(t, e) {
            return this.signAndSendTransaction({
              receiverId: this.accountId,
              actions: [c.stake(e, l.PublicKey.from(t))],
            });
          }
          validateArgs(t) {
            if (
              !(void 0 !== t.byteLength && t.byteLength === t.length) &&
              (Array.isArray(t) || "object" != typeof t)
            )
              throw new f.PositionalArgsError();
          }
          async viewFunction(t, e, r = {}, { parse: i = m, stringify: o = g } = {}) {
            this.validateArgs(r);
            const s = o(r).toString("base64"),
              a = await this.connection.provider.query({
                request_type: "call_function",
                account_id: t,
                method_name: e,
                args_base64: s,
                finality: "optimistic",
              });
            return (
              a.logs && this.printLogs(t, a.logs),
              a.result && a.result.length > 0 && i(n.from(a.result))
            );
          }
          async viewState(
            t,
            e = {
              finality: "optimistic",
            },
          ) {
            const { values: r } = await this.connection.provider.query({
              request_type: "view_state",
              ...e,
              account_id: this.accountId,
              prefix_base64: n.from(t).toString("base64"),
            });
            return r.map(({ key: t, value: e }) => ({
              key: n.from(t, "base64"),
              value: n.from(e, "base64"),
            }));
          }
          async getAccessKeys() {
            const t = await this.connection.provider.query({
              request_type: "view_access_key_list",
              account_id: this.accountId,
              finality: "optimistic",
            });
            return Array.isArray(t) ? t : t.keys;
          }
          async getAccountDetails() {
            return {
              authorizedApps: (await this.getAccessKeys())
                .filter((t) => "FullAccess" !== t.access_key.permission)
                .map((t) => {
                  const e = t.access_key.permission;
                  return {
                    contractId: e.FunctionCall.receiver_id,
                    amount: e.FunctionCall.allowance,
                    publicKey: t.public_key,
                  };
                }),
            };
          }
          async getAccountBalance() {
            const t = await this.connection.provider.experimental_protocolConfig({
                finality: "final",
              }),
              e = await this.state(),
              r = new s.default(t.runtime_config.storage_amount_per_byte),
              n = new s.default(e.storage_usage).mul(r),
              i = new s.default(e.locked),
              o = new s.default(e.amount).add(i),
              a = o.sub(s.default.max(i, n));
            return {
              total: o.toString(),
              stateStaked: n.toString(),
              staked: i.toString(),
              available: a.toString(),
            };
          }
        }
        e.Account = w;
      },
      96726: (t, e, r) => {
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.UrlAccountCreator = e.LocalAccountCreator = e.AccountCreator = void 0);
        const n = r(73490);
        class i {}
        e.AccountCreator = i;
        e.LocalAccountCreator = class extends i {
          constructor(t, e) {
            super(), (this.masterAccount = t), (this.initialBalance = e);
          }
          async createAccount(t, e) {
            await this.masterAccount.createAccount(t, e, this.initialBalance);
          }
        };
        e.UrlAccountCreator = class extends i {
          constructor(t, e) {
            super(), (this.connection = t), (this.helperUrl = e);
          }
          async createAccount(t, e) {
            await n.fetchJson(
              `${this.helperUrl}/account`,
              JSON.stringify({
                newAccountId: t,
                newAccountPublicKey: e.toString(),
              }),
            );
          }
        };
      },
      95646: function (t, e, r) {
        var n = r(48764).Buffer,
          i =
            (this && this.__importDefault) ||
            function (t) {
              return t && t.__esModule
                ? t
                : {
                    default: t,
                  };
            };
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.Account2FA =
            e.AccountMultisig =
            e.MULTISIG_CONFIRM_METHODS =
            e.MULTISIG_CHANGE_METHODS =
            e.MULTISIG_DEPOSIT =
            e.MULTISIG_GAS =
            e.MULTISIG_ALLOWANCE =
            e.MULTISIG_STORAGE_KEY =
              void 0);
        const o = i(r(13550)),
          s = i(r(83686)),
          a = r(45180),
          c = r(77084),
          u = r(56393),
          h = r(49521),
          l = r(73490);
        (e.MULTISIG_STORAGE_KEY = "__multisigRequest"),
          (e.MULTISIG_ALLOWANCE = new o.default(c.parseNearAmount("1"))),
          (e.MULTISIG_GAS = new o.default("100000000000000")),
          (e.MULTISIG_DEPOSIT = new o.default("0")),
          (e.MULTISIG_CHANGE_METHODS = [
            "add_request",
            "add_request_and_confirm",
            "delete_request",
            "confirm",
          ]),
          (e.MULTISIG_CONFIRM_METHODS = ["confirm"]);
        const f = {
          [e.MULTISIG_STORAGE_KEY]: null,
        };
        class d extends a.Account {
          constructor(t, e, r) {
            super(t, e),
              (this.storage = r.storage),
              (this.onAddRequestResult = r.onAddRequestResult);
          }
          async signAndSendTransactionWithAccount(t, e) {
            return super.signAndSendTransaction({
              receiverId: t,
              actions: e,
            });
          }
          signAndSendTransaction(...t) {
            return "string" == typeof t[0]
              ? this._signAndSendTransaction({
                  receiverId: t[0],
                  actions: t[1],
                })
              : this._signAndSendTransaction(t[0]);
          }
          async _signAndSendTransaction({ receiverId: t, actions: r }) {
            const { accountId: i } = this,
              o = n.from(
                JSON.stringify({
                  request: {
                    receiver_id: t,
                    actions: y(r, i, t),
                  },
                }),
              );
            let s;
            try {
              s = await super.signAndSendTransaction({
                receiverId: i,
                actions: [
                  h.functionCall("add_request_and_confirm", o, e.MULTISIG_GAS, e.MULTISIG_DEPOSIT),
                ],
              });
            } catch (e) {
              if (
                e
                  .toString()
                  .includes("Account has too many active requests. Confirm or delete some")
              )
                return (
                  await this.deleteUnconfirmedRequests(), await this.signAndSendTransaction(t, r)
                );
              throw e;
            }
            if (!s.status) throw new Error("Request failed");
            const a = {
              ...s.status,
            };
            if (!a.SuccessValue || "string" != typeof a.SuccessValue)
              throw new Error("Request failed");
            return (
              this.setRequest({
                accountId: i,
                actions: r,
                requestId: parseInt(n.from(a.SuccessValue, "base64").toString("ascii"), 10),
              }),
              this.onAddRequestResult && (await this.onAddRequestResult(s)),
              this.deleteUnconfirmedRequests(),
              s
            );
          }
          async deleteUnconfirmedRequests() {
            const t = await this.getRequestIds(),
              { requestId: r } = this.getRequest();
            for (const n of t)
              if (n != r)
                try {
                  await super.signAndSendTransaction({
                    receiverId: this.accountId,
                    actions: [
                      h.functionCall(
                        "delete_request",
                        {
                          request_id: n,
                        },
                        e.MULTISIG_GAS,
                        e.MULTISIG_DEPOSIT,
                      ),
                    ],
                  });
                } catch (t) {
                  console.warn(
                    "Attempt to delete an earlier request before 15 minutes failed. Will try again.",
                  );
                }
          }
          async getRequestIds() {
            return this.viewFunction(this.accountId, "list_request_ids");
          }
          getRequest() {
            return this.storage
              ? JSON.parse(this.storage.getItem(e.MULTISIG_STORAGE_KEY) || "{}")
              : f[e.MULTISIG_STORAGE_KEY];
          }
          setRequest(t) {
            if (this.storage)
              return this.storage.setItem(e.MULTISIG_STORAGE_KEY, JSON.stringify(t));
            f[e.MULTISIG_STORAGE_KEY] = t;
          }
        }
        e.AccountMultisig = d;
        e.Account2FA = class extends d {
          constructor(t, e, r) {
            super(t, e, r),
              (this.helperUrl = "https://helper.testnet.near.org"),
              (this.helperUrl = r.helperUrl || this.helperUrl),
              (this.storage = r.storage),
              (this.sendCode = r.sendCode || this.sendCodeDefault),
              (this.getCode = r.getCode || this.getCodeDefault),
              (this.verifyCode = r.verifyCode || this.verifyCodeDefault),
              (this.onConfirmResult = r.onConfirmResult);
          }
          async signAndSendTransaction(...t) {
            if ("string" == typeof t[0]) {
              return (
                s.default("Account.signAndSendTransaction(receiverId, actions")(
                  "use `Account2FA.signAndSendTransaction(SignAndSendTransactionOptions)` instead",
                ),
                this.__signAndSendTransaction({
                  receiverId: t[0],
                  actions: t[1],
                })
              );
            }
            return this.__signAndSendTransaction(t[0]);
          }
          async __signAndSendTransaction({ receiverId: t, actions: e }) {
            await super.signAndSendTransaction({
              receiverId: t,
              actions: e,
            }),
              await this.sendCode();
            const r = await this.promptAndVerify();
            return this.onConfirmResult && (await this.onConfirmResult(r)), r;
          }
          async deployMultisig(t) {
            const { accountId: r } = this,
              i = (await this.getRecoveryMethods()).data
                .filter(
                  ({ kind: t, publicKey: e }) => ("phrase" === t || "ledger" === t) && null !== e,
                )
                .map((t) => t.publicKey),
              o = (await this.getAccessKeys())
                .filter(
                  ({ public_key: t, access_key: { permission: e } }) =>
                    "FullAccess" === e && !i.includes(t),
                )
                .map((t) => t.public_key)
                .map(p),
              s = p(
                (
                  await this.postSignedJson("/2fa/getAccessKey", {
                    accountId: r,
                  })
                ).publicKey,
              ),
              a = n.from(
                JSON.stringify({
                  num_confirmations: 2,
                }),
              ),
              c = [
                ...o.map((t) => h.deleteKey(t)),
                ...o.map((t) =>
                  h.addKey(t, h.functionCallAccessKey(r, e.MULTISIG_CHANGE_METHODS, null)),
                ),
                h.addKey(s, h.functionCallAccessKey(r, e.MULTISIG_CONFIRM_METHODS, null)),
                h.deployContract(t),
              ];
            return (
              "11111111111111111111111111111111" === (await this.state()).code_hash &&
                c.push(h.functionCall("new", a, e.MULTISIG_GAS, e.MULTISIG_DEPOSIT)),
              console.log("deploying multisig contract for", r),
              await super.signAndSendTransactionWithAccount(r, c)
            );
          }
          async disable(t) {
            const { accountId: e } = this,
              r = (await this.getAccessKeys())
                .filter(({ access_key: t }) => "FullAccess" !== t.permission)
                .filter(({ access_key: t }) => {
                  const r = t.permission.FunctionCall;
                  return (
                    r.receiver_id === e &&
                    4 === r.method_names.length &&
                    r.method_names.includes("add_request_and_confirm")
                  );
                }),
              n = u.PublicKey.from(
                (
                  await this.postSignedJson("/2fa/getAccessKey", {
                    accountId: e,
                  })
                ).publicKey,
              ),
              i = [
                h.deleteKey(n),
                ...r.map(({ public_key: t }) => h.deleteKey(u.PublicKey.from(t))),
                ...r.map(({ public_key: t }) => h.addKey(u.PublicKey.from(t), null)),
                h.deployContract(t),
              ];
            return (
              console.log("disabling 2fa for", e),
              await this.signAndSendTransaction({
                receiverId: e,
                actions: i,
              })
            );
          }
          async sendCodeDefault() {
            const { accountId: t } = this,
              { requestId: e } = this.getRequest(),
              r = await this.get2faMethod();
            return (
              await this.postSignedJson("/2fa/send", {
                accountId: t,
                method: r,
                requestId: e,
              }),
              e
            );
          }
          async getCodeDefault(t) {
            throw new Error(
              'There is no getCode callback provided. Please provide your own in AccountMultisig constructor options. It has a parameter method where method.kind is "email" or "phone".',
            );
          }
          async promptAndVerify() {
            const t = await this.get2faMethod(),
              e = await this.getCode(t);
            try {
              return await this.verifyCode(e);
            } catch (t) {
              if (
                (console.warn("Error validating security code:", t),
                t.toString().includes("invalid 2fa code provided") ||
                  t.toString().includes("2fa code not valid"))
              )
                return await this.promptAndVerify();
              throw t;
            }
          }
          async verifyCodeDefault(t) {
            const { accountId: e } = this,
              r = this.getRequest();
            if (!r) throw new Error("no request pending");
            const { requestId: n } = r;
            return await this.postSignedJson("/2fa/verify", {
              accountId: e,
              securityCode: t,
              requestId: n,
            });
          }
          async getRecoveryMethods() {
            const { accountId: t } = this;
            return {
              accountId: t,
              data: await this.postSignedJson("/account/recoveryMethods", {
                accountId: t,
              }),
            };
          }
          async get2faMethod() {
            let { data: t } = await this.getRecoveryMethods();
            if ((t && t.length && (t = t.find((t) => 0 === t.kind.indexOf("2fa-"))), !t))
              return null;
            const { kind: e, detail: r } = t;
            return {
              kind: e,
              detail: r,
            };
          }
          async signatureFor() {
            const { accountId: t } = this,
              e = (
                await this.connection.provider.block({
                  finality: "final",
                })
              ).header.height.toString(),
              r = await this.connection.signer.signMessage(n.from(e), t, this.connection.networkId);
            return {
              blockNumber: e,
              blockNumberSignature: n.from(r.signature).toString("base64"),
            };
          }
          async postSignedJson(t, e) {
            return await l.fetchJson(
              this.helperUrl + t,
              JSON.stringify({
                ...e,
                ...(await this.signatureFor()),
              }),
            );
          }
        };
        const p = (t) => u.PublicKey.from(t),
          y = (t, r, i) =>
            t.map((t) => {
              const o = t.enum,
                {
                  gas: s,
                  publicKey: a,
                  methodName: c,
                  args: u,
                  deposit: h,
                  accessKey: l,
                  code: f,
                } = t[o],
                d = {
                  type: o[0].toUpperCase() + o.substr(1),
                  gas: (s && s.toString()) || void 0,
                  public_key: (a && ((p = a), p.toString().replace("ed25519:", ""))) || void 0,
                  method_name: c,
                  args: (u && n.from(u).toString("base64")) || void 0,
                  code: (f && n.from(f).toString("base64")) || void 0,
                  amount: (h && h.toString()) || void 0,
                  deposit: (h && h.toString()) || "0",
                  permission: void 0,
                };
              var p;
              if (
                l &&
                (i === r &&
                  "fullAccess" !== l.permission.enum &&
                  (d.permission = {
                    receiver_id: r,
                    allowance: e.MULTISIG_ALLOWANCE.toString(),
                    method_names: e.MULTISIG_CHANGE_METHODS,
                  }),
                "functionCall" === l.permission.enum)
              ) {
                const { receiverId: t, methodNames: e, allowance: r } = l.permission.functionCall;
                d.permission = {
                  receiver_id: t,
                  allowance: (r && r.toString()) || void 0,
                  method_names: e,
                };
              }
              return d;
            });
      },
      43960: (t, e, r) => {
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.connect = void 0);
        const n = r(27757);
        e.connect = async function (t) {
          return new n.Near(t);
        };
      },
      68447: function (t, e, r) {
        var n =
            (this && this.__createBinding) ||
            (Object.create
              ? function (t, e, r, n) {
                  void 0 === n && (n = r),
                    Object.defineProperty(t, n, {
                      enumerable: !0,
                      get: function () {
                        return e[r];
                      },
                    });
                }
              : function (t, e, r, n) {
                  void 0 === n && (n = r), (t[n] = e[r]);
                }),
          i =
            (this && this.__setModuleDefault) ||
            (Object.create
              ? function (t, e) {
                  Object.defineProperty(t, "default", {
                    enumerable: !0,
                    value: e,
                  });
                }
              : function (t, e) {
                  t.default = e;
                }),
          o =
            (this && this.__importStar) ||
            function (t) {
              if (t && t.__esModule) return t;
              var e = {};
              if (null != t)
                for (var r in t) "default" !== r && Object.hasOwnProperty.call(t, r) && n(e, t, r);
              return i(e, t), e;
            },
          s =
            (this && this.__exportStar) ||
            function (t, e) {
              for (var r in t) "default" === r || e.hasOwnProperty(r) || n(e, t, r);
            };
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.keyStores = o(r(89510))),
          s(r(71137), e),
          s(r(43960), e),
          r(58010);
      },
      71137: function (t, e, r) {
        var n =
            (this && this.__createBinding) ||
            (Object.create
              ? function (t, e, r, n) {
                  void 0 === n && (n = r),
                    Object.defineProperty(t, n, {
                      enumerable: !0,
                      get: function () {
                        return e[r];
                      },
                    });
                }
              : function (t, e, r, n) {
                  void 0 === n && (n = r), (t[n] = e[r]);
                }),
          i =
            (this && this.__setModuleDefault) ||
            (Object.create
              ? function (t, e) {
                  Object.defineProperty(t, "default", {
                    enumerable: !0,
                    value: e,
                  });
                }
              : function (t, e) {
                  t.default = e;
                }),
          o =
            (this && this.__importStar) ||
            function (t) {
              if (t && t.__esModule) return t;
              var e = {};
              if (null != t)
                for (var r in t) "default" !== r && Object.hasOwnProperty.call(t, r) && n(e, t, r);
              return i(e, t), e;
            };
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.WalletConnection =
            e.WalletAccount =
            e.ConnectedWalletAccount =
            e.Near =
            e.KeyPair =
            e.Signer =
            e.InMemorySigner =
            e.Contract =
            e.Connection =
            e.Account =
            e.multisig =
            e.validators =
            e.transactions =
            e.utils =
            e.providers =
            e.accountCreator =
              void 0);
        const s = o(r(84920));
        e.providers = s;
        const a = o(r(64481));
        e.utils = a;
        const c = o(r(49521));
        e.transactions = c;
        const u = o(r(90296));
        e.validators = u;
        const h = r(45180);
        Object.defineProperty(e, "Account", {
          enumerable: !0,
          get: function () {
            return h.Account;
          },
        });
        const l = o(r(95646));
        e.multisig = l;
        const f = o(r(96726));
        e.accountCreator = f;
        const d = r(19249);
        Object.defineProperty(e, "Connection", {
          enumerable: !0,
          get: function () {
            return d.Connection;
          },
        });
        const p = r(31344);
        Object.defineProperty(e, "Signer", {
          enumerable: !0,
          get: function () {
            return p.Signer;
          },
        }),
          Object.defineProperty(e, "InMemorySigner", {
            enumerable: !0,
            get: function () {
              return p.InMemorySigner;
            },
          });
        const y = r(45918);
        Object.defineProperty(e, "Contract", {
          enumerable: !0,
          get: function () {
            return y.Contract;
          },
        });
        const m = r(56393);
        Object.defineProperty(e, "KeyPair", {
          enumerable: !0,
          get: function () {
            return m.KeyPair;
          },
        });
        const g = r(27757);
        Object.defineProperty(e, "Near", {
          enumerable: !0,
          get: function () {
            return g.Near;
          },
        });
        const w = r(39802);
        Object.defineProperty(e, "ConnectedWalletAccount", {
          enumerable: !0,
          get: function () {
            return w.ConnectedWalletAccount;
          },
        }),
          Object.defineProperty(e, "WalletAccount", {
            enumerable: !0,
            get: function () {
              return w.WalletAccount;
            },
          }),
          Object.defineProperty(e, "WalletConnection", {
            enumerable: !0,
            get: function () {
              return w.WalletConnection;
            },
          });
      },
      19249: (t, e, r) => {
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.Connection = void 0);
        const n = r(84920),
          i = r(31344);
        class o {
          constructor(t, e, r) {
            (this.networkId = t), (this.provider = e), (this.signer = r);
          }
          static fromConfig(t) {
            const e = (function (t) {
                switch (t.type) {
                  case void 0:
                    return t;
                  case "JsonRpcProvider":
                    return new n.JsonRpcProvider(t.args.url);
                  default:
                    throw new Error(`Unknown provider type ${t.type}`);
                }
              })(t.provider),
              r = (function (t) {
                switch (t.type) {
                  case void 0:
                    return t;
                  case "InMemorySigner":
                    return new i.InMemorySigner(t.keyStore);
                  default:
                    throw new Error(`Unknown signer type ${t.type}`);
                }
              })(t.signer);
            return new o(t.networkId, e, r);
          }
        }
        e.Connection = o;
      },
      24873: function (t, e, r) {
        var n =
          (this && this.__importDefault) ||
          function (t) {
            return t && t.__esModule
              ? t
              : {
                  default: t,
                };
          };
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.DEFAULT_FUNCTION_CALL_GAS = void 0);
        const i = n(r(13550));
        e.DEFAULT_FUNCTION_CALL_GAS = new i.default("30000000000000");
      },
      45918: function (t, e, r) {
        var n =
          (this && this.__importDefault) ||
          function (t) {
            return t && t.__esModule
              ? t
              : {
                  default: t,
                };
          };
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.Contract = void 0);
        const i = n(r(13550)),
          o = n(r(83686)),
          s = r(84920),
          a = r(44497);

        function c(t, e) {
          return {
            [t]: (...t) => e(...t),
          }[t];
        }
        const u = (t) => t && void 0 !== t.byteLength && t.byteLength === t.length,
          h = (t) => "[object Object]" === Object.prototype.toString.call(t);
        e.Contract = class {
          constructor(t, e, r) {
            (this.account = t), (this.contractId = e);
            const { viewMethods: n = [], changeMethods: i = [] } = r;
            n.forEach((t) => {
              Object.defineProperty(this, t, {
                writable: !1,
                enumerable: !0,
                value: c(t, async (e = {}, r = {}, ...n) => {
                  if (n.length || (!h(e) && !u(e)) || !h(r)) throw new a.PositionalArgsError();
                  return this.account.viewFunction(this.contractId, t, e, r);
                }),
              });
            }),
              i.forEach((t) => {
                Object.defineProperty(this, t, {
                  writable: !1,
                  enumerable: !0,
                  value: c(t, async (...e) => {
                    if (e.length && (e.length > 3 || (!h(e[0]) && !u(e[0]))))
                      throw new a.PositionalArgsError();
                    if (e.length > 1 || !e[0] || !e[0].args) {
                      return (
                        o.default("contract.methodName(args, gas, amount)")(
                          "use `contract.methodName({ args, gas?, amount?, callbackUrl?, meta? })` instead",
                        ),
                        this._changeMethod({
                          methodName: t,
                          args: e[0],
                          gas: e[1],
                          amount: e[2],
                        })
                      );
                    }
                    return this._changeMethod({
                      methodName: t,
                      ...e[0],
                    });
                  }),
                });
              });
          }
          async _changeMethod({
            args: t,
            methodName: e,
            gas: r,
            amount: n,
            meta: o,
            callbackUrl: c,
          }) {
            !(function (t) {
              const e = "number, decimal string or BN";
              for (const r of Object.keys(t)) {
                const n = t[r];
                if (n && !i.default.isBN(n) && isNaN(n)) throw new a.ArgumentTypeError(r, e, n);
              }
            })({
              gas: r,
              amount: n,
            });
            const u = await this.account.functionCall({
              contractId: this.contractId,
              methodName: e,
              args: t,
              gas: r,
              attachedDeposit: n,
              walletMeta: o,
              walletCallbackUrl: c,
            });
            return s.getTransactionLastResult(u);
          }
        };
      },
      89510: (t, e, r) => {
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.MergeKeyStore =
            e.BrowserLocalStorageKeyStore =
            e.InMemoryKeyStore =
            e.KeyStore =
              void 0);
        const n = r(76165);
        Object.defineProperty(e, "KeyStore", {
          enumerable: !0,
          get: function () {
            return n.KeyStore;
          },
        });
        const i = r(22657);
        Object.defineProperty(e, "InMemoryKeyStore", {
          enumerable: !0,
          get: function () {
            return i.InMemoryKeyStore;
          },
        });
        const o = r(17884);
        Object.defineProperty(e, "BrowserLocalStorageKeyStore", {
          enumerable: !0,
          get: function () {
            return o.BrowserLocalStorageKeyStore;
          },
        });
        const s = r(50850);
        Object.defineProperty(e, "MergeKeyStore", {
          enumerable: !0,
          get: function () {
            return s.MergeKeyStore;
          },
        });
      },
      17884: (t, e, r) => {
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.BrowserLocalStorageKeyStore = void 0);
        const n = r(76165),
          i = r(56393);
        class o extends n.KeyStore {
          constructor(t = window.localStorage, e = "near-api-js:keystore:") {
            super(), (this.localStorage = t), (this.prefix = e);
          }
          async setKey(t, e, r) {
            this.localStorage.setItem(this.storageKeyForSecretKey(t, e), r.toString());
          }
          async getKey(t, e) {
            const r = this.localStorage.getItem(this.storageKeyForSecretKey(t, e));
            return r ? i.KeyPair.fromString(r) : null;
          }
          async removeKey(t, e) {
            this.localStorage.removeItem(this.storageKeyForSecretKey(t, e));
          }
          async clear() {
            for (const t of this.storageKeys())
              t.startsWith(this.prefix) && this.localStorage.removeItem(t);
          }
          async getNetworks() {
            const t = new Set();
            for (const e of this.storageKeys())
              if (e.startsWith(this.prefix)) {
                const r = e.substring(this.prefix.length).split(":");
                t.add(r[1]);
              }
            return Array.from(t.values());
          }
          async getAccounts(t) {
            const e = new Array();
            for (const r of this.storageKeys())
              if (r.startsWith(this.prefix)) {
                const n = r.substring(this.prefix.length).split(":");
                n[1] === t && e.push(n[0]);
              }
            return e;
          }
          storageKeyForSecretKey(t, e) {
            return `${this.prefix}${e}:${t}`;
          }
          *storageKeys() {
            for (let t = 0; t < this.localStorage.length; t++) yield this.localStorage.key(t);
          }
        }
        e.BrowserLocalStorageKeyStore = o;
      },
      22657: (t, e, r) => {
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.InMemoryKeyStore = void 0);
        const n = r(76165),
          i = r(56393);
        class o extends n.KeyStore {
          constructor() {
            super(), (this.keys = {});
          }
          async setKey(t, e, r) {
            this.keys[`${e}:${t}`] = r.toString();
          }
          async getKey(t, e) {
            const r = this.keys[`${e}:${t}`];
            return r ? i.KeyPair.fromString(r) : null;
          }
          async removeKey(t, e) {
            delete this.keys[`${e}:${t}`];
          }
          async clear() {
            this.keys = {};
          }
          async getNetworks() {
            const t = new Set();
            return (
              Object.keys(this.keys).forEach((e) => {
                const r = e.split(":");
                t.add(r[1]);
              }),
              Array.from(t.values())
            );
          }
          async getAccounts(t) {
            const e = new Array();
            return (
              Object.keys(this.keys).forEach((r) => {
                const n = r.split(":");
                n[n.length - 1] === t && e.push(n.slice(0, n.length - 1).join(":"));
              }),
              e
            );
          }
          toString() {
            return "InMemoryKeyStore";
          }
        }
        e.InMemoryKeyStore = o;
      },
      76165: (t, e) => {
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.KeyStore = void 0);
        e.KeyStore = class {};
      },
      50850: (t, e, r) => {
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.MergeKeyStore = void 0);
        const n = r(76165);
        class i extends n.KeyStore {
          constructor(
            t,
            e = {
              writeKeyStoreIndex: 0,
            },
          ) {
            super(), (this.options = e), (this.keyStores = t);
          }
          async setKey(t, e, r) {
            await this.keyStores[this.options.writeKeyStoreIndex].setKey(t, e, r);
          }
          async getKey(t, e) {
            for (const r of this.keyStores) {
              const n = await r.getKey(t, e);
              if (n) return n;
            }
            return null;
          }
          async removeKey(t, e) {
            for (const r of this.keyStores) await r.removeKey(t, e);
          }
          async clear() {
            for (const t of this.keyStores) await t.clear();
          }
          async getNetworks() {
            const t = new Set();
            for (const e of this.keyStores) for (const r of await e.getNetworks()) t.add(r);
            return Array.from(t);
          }
          async getAccounts(t) {
            const e = new Set();
            for (const r of this.keyStores) for (const n of await r.getAccounts(t)) e.add(n);
            return Array.from(e);
          }
          toString() {
            return `MergeKeyStore(${this.keyStores.join(", ")})`;
          }
        }
        e.MergeKeyStore = i;
      },
      27757: function (t, e, r) {
        var n =
          (this && this.__importDefault) ||
          function (t) {
            return t && t.__esModule
              ? t
              : {
                  default: t,
                };
          };
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.Near = void 0);
        const i = n(r(13550)),
          o = r(45180),
          s = r(19249),
          a = r(45918),
          c = r(96726);
        e.Near = class {
          constructor(t) {
            if (
              ((this.config = t),
              (this.connection = s.Connection.fromConfig({
                networkId: t.networkId,
                provider: {
                  type: "JsonRpcProvider",
                  args: {
                    url: t.nodeUrl,
                  },
                },
                signer: t.signer || {
                  type: "InMemorySigner",
                  keyStore: t.keyStore || t.deps.keyStore,
                },
              })),
              t.masterAccount)
            ) {
              const e = t.initialBalance
                ? new i.default(t.initialBalance)
                : new i.default("500000000000000000000000000");
              this.accountCreator = new c.LocalAccountCreator(
                new o.Account(this.connection, t.masterAccount),
                e,
              );
            } else
              t.helperUrl
                ? (this.accountCreator = new c.UrlAccountCreator(this.connection, t.helperUrl))
                : (this.accountCreator = null);
          }
          async account(t) {
            return new o.Account(this.connection, t);
          }
          async createAccount(t, e) {
            if (!this.accountCreator)
              throw new Error(
                "Must specify account creator, either via masterAccount or helperUrl configuration settings.",
              );
            return await this.accountCreator.createAccount(t, e), new o.Account(this.connection, t);
          }
          async loadContract(t, e) {
            const r = new o.Account(this.connection, e.sender);
            return new a.Contract(r, t, e);
          }
          async sendTokens(t, e, r) {
            console.warn("near.sendTokens is deprecated. Use `yourAccount.sendMoney` instead.");
            const n = new o.Account(this.connection, e);
            return (await n.sendMoney(r, t)).transaction_outcome.id;
          }
        };
      },
      84920: (t, e, r) => {
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.ErrorContext =
            e.TypedError =
            e.getTransactionLastResult =
            e.FinalExecutionStatusBasic =
            e.JsonRpcProvider =
            e.Provider =
              void 0);
        const n = r(31374);
        Object.defineProperty(e, "Provider", {
          enumerable: !0,
          get: function () {
            return n.Provider;
          },
        }),
          Object.defineProperty(e, "getTransactionLastResult", {
            enumerable: !0,
            get: function () {
              return n.getTransactionLastResult;
            },
          }),
          Object.defineProperty(e, "FinalExecutionStatusBasic", {
            enumerable: !0,
            get: function () {
              return n.FinalExecutionStatusBasic;
            },
          });
        const i = r(26550);
        Object.defineProperty(e, "JsonRpcProvider", {
          enumerable: !0,
          get: function () {
            return i.JsonRpcProvider;
          },
        }),
          Object.defineProperty(e, "TypedError", {
            enumerable: !0,
            get: function () {
              return i.TypedError;
            },
          }),
          Object.defineProperty(e, "ErrorContext", {
            enumerable: !0,
            get: function () {
              return i.ErrorContext;
            },
          });
      },
      26550: function (t, e, r) {
        var n = r(48764).Buffer,
          i =
            (this && this.__importDefault) ||
            function (t) {
              return t && t.__esModule
                ? t
                : {
                    default: t,
                  };
            };
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.JsonRpcProvider = e.ErrorContext = e.TypedError = void 0);
        const o = i(r(83686)),
          s = r(31374),
          a = r(73490),
          c = r(44497);
        Object.defineProperty(e, "TypedError", {
          enumerable: !0,
          get: function () {
            return c.TypedError;
          },
        }),
          Object.defineProperty(e, "ErrorContext", {
            enumerable: !0,
            get: function () {
              return c.ErrorContext;
            },
          });
        const u = r(25532),
          h = i(r(12707)),
          l = r(9743);
        let f = 123;
        class d extends s.Provider {
          constructor(t) {
            super(),
              (this.connection = {
                url: t,
              });
          }
          async status() {
            return this.sendJsonRpc("status", []);
          }
          async sendTransaction(t) {
            const e = t.encode();
            return this.sendJsonRpc("broadcast_tx_commit", [n.from(e).toString("base64")]);
          }
          async sendTransactionAsync(t) {
            const e = t.encode();
            return this.sendJsonRpc("broadcast_tx_async", [n.from(e).toString("base64")]);
          }
          async txStatus(t, e) {
            return "string" == typeof t ? this.txStatusString(t, e) : this.txStatusUint8Array(t, e);
          }
          async txStatusUint8Array(t, e) {
            return this.sendJsonRpc("tx", [u.baseEncode(t), e]);
          }
          async txStatusString(t, e) {
            return this.sendJsonRpc("tx", [t, e]);
          }
          async txStatusReceipts(t, e) {
            return this.sendJsonRpc("EXPERIMENTAL_tx_status", [u.baseEncode(t), e]);
          }
          async query(...t) {
            let e;
            if (1 === t.length) e = await this.sendJsonRpc("query", t[0]);
            else {
              const [r, n] = t;
              e = await this.sendJsonRpc("query", [r, n]);
            }
            if (e && e.error)
              throw new c.TypedError(
                `Querying ${t} failed: ${e.error}.\n${JSON.stringify(e, null, 2)}`,
                l.getErrorTypeFromErrorMessage(e.error),
              );
            return e;
          }
          async block(t) {
            const { finality: e } = t;
            let { blockId: r } = t;
            if ("object" != typeof t) {
              o.default("JsonRpcProvider.block(blockId)")(
                "use `block({ blockId })` or `block({ finality })` instead",
              ),
                (r = t);
            }
            return this.sendJsonRpc("block", {
              block_id: r,
              finality: e,
            });
          }
          async blockChanges(t) {
            const { finality: e } = t,
              { blockId: r } = t;
            return this.sendJsonRpc("EXPERIMENTAL_changes_in_block", {
              block_id: r,
              finality: e,
            });
          }
          async chunk(t) {
            return this.sendJsonRpc("chunk", [t]);
          }
          async validators(t) {
            return this.sendJsonRpc("validators", [t]);
          }
          async experimental_genesisConfig() {
            return (
              o.default("JsonRpcProvider.experimental_protocolConfig()")(
                "use `experimental_protocolConfig({ sync_checkpoint: 'genesis' })` to fetch the up-to-date or genesis protocol config explicitly",
              ),
              await this.sendJsonRpc("EXPERIMENTAL_protocol_config", {
                sync_checkpoint: "genesis",
              })
            );
          }
          async experimental_protocolConfig(t) {
            return await this.sendJsonRpc("EXPERIMENTAL_protocol_config", t);
          }
          async experimental_lightClientProof(t) {
            return (
              o.default("JsonRpcProvider.experimental_lightClientProof(request)")(
                "use `lightClientProof` instead",
              ),
              await this.lightClientProof(t)
            );
          }
          async lightClientProof(t) {
            return await this.sendJsonRpc("EXPERIMENTAL_light_client_proof", t);
          }
          async accessKeyChanges(t, e) {
            const { finality: r } = e,
              { blockId: n } = e;
            return this.sendJsonRpc("EXPERIMENTAL_changes", {
              changes_type: "all_access_key_changes",
              account_ids: t,
              block_id: n,
              finality: r,
            });
          }
          async singleAccessKeyChanges(t, e) {
            const { finality: r } = e,
              { blockId: n } = e;
            return this.sendJsonRpc("EXPERIMENTAL_changes", {
              changes_type: "single_access_key_changes",
              keys: t,
              block_id: n,
              finality: r,
            });
          }
          async accountChanges(t, e) {
            const { finality: r } = e,
              { blockId: n } = e;
            return this.sendJsonRpc("EXPERIMENTAL_changes", {
              changes_type: "account_changes",
              account_ids: t,
              block_id: n,
              finality: r,
            });
          }
          async contractStateChanges(t, e, r = "") {
            const { finality: n } = e,
              { blockId: i } = e;
            return this.sendJsonRpc("EXPERIMENTAL_changes", {
              changes_type: "data_changes",
              account_ids: t,
              key_prefix_base64: r,
              block_id: i,
              finality: n,
            });
          }
          async contractCodeChanges(t, e) {
            const { finality: r } = e,
              { blockId: n } = e;
            return this.sendJsonRpc("EXPERIMENTAL_changes", {
              changes_type: "contract_code_changes",
              account_ids: t,
              block_id: n,
              finality: r,
            });
          }
          async gasPrice(t) {
            return await this.sendJsonRpc("gas_price", [t]);
          }
          async sendJsonRpc(t, e) {
            const r = await h.default(500, 12, 1.5, async () => {
                try {
                  const r = {
                      method: t,
                      params: e,
                      id: f++,
                      jsonrpc: "2.0",
                    },
                    n = await a.fetchJson(this.connection, JSON.stringify(r));
                  if (n.error) {
                    if ("object" == typeof n.error.data) {
                      if (
                        "string" == typeof n.error.data.error_message &&
                        "string" == typeof n.error.data.error_type
                      )
                        throw new c.TypedError(n.error.data.error_message, n.error.data.error_type);
                      throw l.parseRpcError(n.error.data);
                    }
                    {
                      const t = `[${n.error.code}] ${n.error.message}: ${n.error.data}`;
                      if (
                        "Timeout" === n.error.data ||
                        t.includes("Timeout error") ||
                        t.includes("query has timed out")
                      )
                        throw new c.TypedError(t, "TimeoutError");
                      throw new c.TypedError(t, l.getErrorTypeFromErrorMessage(n.error.data));
                    }
                  }
                  return n;
                } catch (r) {
                  if ("TimeoutError" === r.type)
                    return console.warn(`Retrying request to ${t} as it has timed out`, e), null;
                  throw r;
                }
              }),
              { result: n } = r;
            if (void 0 === n)
              throw new c.TypedError(
                `Exceeded 12 attempts for request to ${t}.`,
                "RetriesExceeded",
              );
            return n;
          }
        }
        e.JsonRpcProvider = d;
      },
      31374: (t, e, r) => {
        var n = r(48764).Buffer;
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.getTransactionLastResult =
            e.Provider =
            e.IdType =
            e.FinalExecutionStatusBasic =
            e.ExecutionStatusBasic =
              void 0),
          (function (t) {
            (t.Unknown = "Unknown"), (t.Pending = "Pending"), (t.Failure = "Failure");
          })(e.ExecutionStatusBasic || (e.ExecutionStatusBasic = {})),
          (function (t) {
            (t.NotStarted = "NotStarted"), (t.Started = "Started"), (t.Failure = "Failure");
          })(e.FinalExecutionStatusBasic || (e.FinalExecutionStatusBasic = {})),
          (function (t) {
            (t.Transaction = "transaction"), (t.Receipt = "receipt");
          })(e.IdType || (e.IdType = {}));
        (e.Provider = class {}),
          (e.getTransactionLastResult = function (t) {
            if ("object" == typeof t.status && "string" == typeof t.status.SuccessValue) {
              const e = n.from(t.status.SuccessValue, "base64").toString();
              try {
                return JSON.parse(e);
              } catch (t) {
                return e;
              }
            }
            return null;
          });
      },
      31344: function (t, e, r) {
        var n =
          (this && this.__importDefault) ||
          function (t) {
            return t && t.__esModule
              ? t
              : {
                  default: t,
                };
          };
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.InMemorySigner = e.Signer = void 0);
        const i = n(r(72023)),
          o = r(56393),
          s = r(22657);
        class a {}
        e.Signer = a;
        class c extends a {
          constructor(t) {
            super(), (this.keyStore = t);
          }
          static async fromKeyPair(t, e, r) {
            const n = new s.InMemoryKeyStore();
            return await n.setKey(t, e, r), new c(n);
          }
          async createKey(t, e) {
            const r = o.KeyPair.fromRandom("ed25519");
            return await this.keyStore.setKey(e, t, r), r.getPublicKey();
          }
          async getPublicKey(t, e) {
            const r = await this.keyStore.getKey(e, t);
            return null === r ? null : r.getPublicKey();
          }
          async signMessage(t, e, r) {
            const n = new Uint8Array(i.default.sha256.array(t));
            if (!e) throw new Error("InMemorySigner requires provided account id");
            const o = await this.keyStore.getKey(r, e);
            if (null === o) throw new Error(`Key for ${e} not found in ${r}`);
            return o.sign(n);
          }
          toString() {
            return `InMemorySigner(${this.keyStore})`;
          }
        }
        e.InMemorySigner = c;
      },
      49521: function (t, e, r) {
        var n = r(48764).Buffer,
          i =
            (this && this.__importDefault) ||
            function (t) {
              return t && t.__esModule
                ? t
                : {
                    default: t,
                  };
            };
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.signTransaction =
            e.createTransaction =
            e.SCHEMA =
            e.Action =
            e.SignedTransaction =
            e.Transaction =
            e.Signature =
            e.deleteAccount =
            e.deleteKey =
            e.addKey =
            e.stake =
            e.transfer =
            e.functionCall =
            e.stringifyJsonOrBytes =
            e.deployContract =
            e.createAccount =
            e.DeleteAccount =
            e.DeleteKey =
            e.AddKey =
            e.Stake =
            e.Transfer =
            e.FunctionCall =
            e.DeployContract =
            e.CreateAccount =
            e.IAction =
            e.functionCallAccessKey =
            e.fullAccessKey =
            e.AccessKey =
            e.AccessKeyPermission =
            e.FullAccessPermission =
            e.FunctionCallPermission =
              void 0);
        const o = i(r(72023)),
          s = r(93221),
          a = r(25532),
          c = r(56393);
        class u extends s.Assignable {}
        e.FunctionCallPermission = u;
        class h extends s.Assignable {}
        e.FullAccessPermission = h;
        class l extends s.Enum {}
        e.AccessKeyPermission = l;
        class f extends s.Assignable {}
        (e.AccessKey = f),
          (e.fullAccessKey = function () {
            return new f({
              nonce: 0,
              permission: new l({
                fullAccess: new h({}),
              }),
            });
          }),
          (e.functionCallAccessKey = function (t, e, r) {
            return new f({
              nonce: 0,
              permission: new l({
                functionCall: new u({
                  receiverId: t,
                  allowance: r,
                  methodNames: e,
                }),
              }),
            });
          });
        class d extends s.Assignable {}
        e.IAction = d;
        class p extends d {}
        e.CreateAccount = p;
        class y extends d {}
        e.DeployContract = y;
        class m extends d {}
        e.FunctionCall = m;
        class g extends d {}
        e.Transfer = g;
        class w extends d {}
        e.Stake = w;
        class v extends d {}
        e.AddKey = v;
        class b extends d {}
        e.DeleteKey = b;
        class _ extends d {}

        function E(t) {
          return void 0 !== t.byteLength && t.byteLength === t.length
            ? t
            : n.from(JSON.stringify(t));
        }
        (e.DeleteAccount = _),
          (e.createAccount = function () {
            return new I({
              createAccount: new p({}),
            });
          }),
          (e.deployContract = function (t) {
            return new I({
              deployContract: new y({
                code: t,
              }),
            });
          }),
          (e.stringifyJsonOrBytes = E),
          (e.functionCall = function (t, e, r, n, i = E) {
            return new I({
              functionCall: new m({
                methodName: t,
                args: i(e),
                gas: r,
                deposit: n,
              }),
            });
          }),
          (e.transfer = function (t) {
            return new I({
              transfer: new g({
                deposit: t,
              }),
            });
          }),
          (e.stake = function (t, e) {
            return new I({
              stake: new w({
                stake: t,
                publicKey: e,
              }),
            });
          }),
          (e.addKey = function (t, e) {
            return new I({
              addKey: new v({
                publicKey: t,
                accessKey: e,
              }),
            });
          }),
          (e.deleteKey = function (t) {
            return new I({
              deleteKey: new b({
                publicKey: t,
              }),
            });
          }),
          (e.deleteAccount = function (t) {
            return new I({
              deleteAccount: new _({
                beneficiaryId: t,
              }),
            });
          });
        class A extends s.Assignable {}
        e.Signature = A;
        class M extends s.Assignable {
          encode() {
            return a.serialize(e.SCHEMA, this);
          }
          static decode(t) {
            return a.deserialize(e.SCHEMA, M, t);
          }
        }
        e.Transaction = M;
        class S extends s.Assignable {
          encode() {
            return a.serialize(e.SCHEMA, this);
          }
          static decode(t) {
            return a.deserialize(e.SCHEMA, S, t);
          }
        }
        e.SignedTransaction = S;
        class I extends s.Enum {}

        function k(t, e, r, n, i, o) {
          return new M({
            signerId: t,
            publicKey: e,
            nonce: n,
            receiverId: r,
            actions: i,
            blockHash: o,
          });
        }
        async function x(t, r, n, i) {
          const s = a.serialize(e.SCHEMA, t),
            c = new Uint8Array(o.default.sha256.array(s)),
            u = await r.signMessage(s, n, i);
          return [
            c,
            new S({
              transaction: t,
              signature: new A({
                keyType: t.publicKey.keyType,
                data: u.signature,
              }),
            }),
          ];
        }
        (e.Action = I),
          (e.SCHEMA = new Map([
            [
              A,
              {
                kind: "struct",
                fields: [
                  ["keyType", "u8"],
                  ["data", [64]],
                ],
              },
            ],
            [
              S,
              {
                kind: "struct",
                fields: [
                  ["transaction", M],
                  ["signature", A],
                ],
              },
            ],
            [
              M,
              {
                kind: "struct",
                fields: [
                  ["signerId", "string"],
                  ["publicKey", c.PublicKey],
                  ["nonce", "u64"],
                  ["receiverId", "string"],
                  ["blockHash", [32]],
                  ["actions", [I]],
                ],
              },
            ],
            [
              c.PublicKey,
              {
                kind: "struct",
                fields: [
                  ["keyType", "u8"],
                  ["data", [32]],
                ],
              },
            ],
            [
              f,
              {
                kind: "struct",
                fields: [
                  ["nonce", "u64"],
                  ["permission", l],
                ],
              },
            ],
            [
              l,
              {
                kind: "enum",
                field: "enum",
                values: [
                  ["functionCall", u],
                  ["fullAccess", h],
                ],
              },
            ],
            [
              u,
              {
                kind: "struct",
                fields: [
                  [
                    "allowance",
                    {
                      kind: "option",
                      type: "u128",
                    },
                  ],
                  ["receiverId", "string"],
                  ["methodNames", ["string"]],
                ],
              },
            ],
            [
              h,
              {
                kind: "struct",
                fields: [],
              },
            ],
            [
              I,
              {
                kind: "enum",
                field: "enum",
                values: [
                  ["createAccount", p],
                  ["deployContract", y],
                  ["functionCall", m],
                  ["transfer", g],
                  ["stake", w],
                  ["addKey", v],
                  ["deleteKey", b],
                  ["deleteAccount", _],
                ],
              },
            ],
            [
              p,
              {
                kind: "struct",
                fields: [],
              },
            ],
            [
              y,
              {
                kind: "struct",
                fields: [["code", ["u8"]]],
              },
            ],
            [
              m,
              {
                kind: "struct",
                fields: [
                  ["methodName", "string"],
                  ["args", ["u8"]],
                  ["gas", "u64"],
                  ["deposit", "u128"],
                ],
              },
            ],
            [
              g,
              {
                kind: "struct",
                fields: [["deposit", "u128"]],
              },
            ],
            [
              w,
              {
                kind: "struct",
                fields: [
                  ["stake", "u128"],
                  ["publicKey", c.PublicKey],
                ],
              },
            ],
            [
              v,
              {
                kind: "struct",
                fields: [
                  ["publicKey", c.PublicKey],
                  ["accessKey", f],
                ],
              },
            ],
            [
              b,
              {
                kind: "struct",
                fields: [["publicKey", c.PublicKey]],
              },
            ],
            [
              _,
              {
                kind: "struct",
                fields: [["beneficiaryId", "string"]],
              },
            ],
          ])),
          (e.createTransaction = k),
          (e.signTransaction = async function (...t) {
            if (t[0].constructor === M) {
              const [e, r, n, i] = t;
              return x(e, r, n, i);
            }
            {
              const [e, r, n, i, o, s, a] = t;
              return x(k(s, await o.getPublicKey(s, a), e, r, n, i), o, s, a);
            }
          });
      },
      93221: (t, e) => {
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.Assignable = e.Enum = void 0);
        e.Enum = class {
          constructor(t) {
            if (1 !== Object.keys(t).length) throw new Error("Enum can only take single value");
            Object.keys(t).map((e) => {
              (this[e] = t[e]), (this.enum = e);
            });
          }
        };
        e.Assignable = class {
          constructor(t) {
            Object.keys(t).map((e) => {
              this[e] = t[e];
            });
          }
        };
      },
      44497: (t, e, r) => {
        var n = r(34155);
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.logWarning =
            e.ErrorContext =
            e.TypedError =
            e.ArgumentTypeError =
            e.PositionalArgsError =
              void 0);
        class i extends Error {
          constructor() {
            super(
              "Contract method calls expect named arguments wrapped in object, e.g. { argName1: argValue1, argName2: argValue2 }",
            );
          }
        }
        e.PositionalArgsError = i;
        class o extends Error {
          constructor(t, e, r) {
            super(`Expected ${e} for '${t}' argument, but got '${JSON.stringify(r)}'`);
          }
        }
        e.ArgumentTypeError = o;
        class s extends Error {
          constructor(t, e, r) {
            super(t), (this.type = e || "UntypedError"), (this.context = r);
          }
        }
        e.TypedError = s;
        (e.ErrorContext = class {
          constructor(t) {
            this.transactionHash = t;
          }
        }),
          (e.logWarning = function (...t) {
            n.env.NEAR_NO_LOGS || console.warn(...t);
          });
      },
      12707: (t, e) => {
        function r(t) {
          return new Promise((e) => setTimeout(e, t));
        }
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.default = async function (t, e, n, i) {
            let o = t;
            for (let t = 0; t < e; t++) {
              const t = await i();
              if (t) return t;
              await r(o), (o *= n);
            }
            return null;
          });
      },
      77084: function (t, e, r) {
        var n =
          (this && this.__importDefault) ||
          function (t) {
            return t && t.__esModule
              ? t
              : {
                  default: t,
                };
          };
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.parseNearAmount =
            e.formatNearAmount =
            e.NEAR_NOMINATION =
            e.NEAR_NOMINATION_EXP =
              void 0);
        const i = n(r(13550));
        (e.NEAR_NOMINATION_EXP = 24),
          (e.NEAR_NOMINATION = new i.default("10", 10).pow(
            new i.default(e.NEAR_NOMINATION_EXP, 10),
          ));
        const o = [],
          s = new i.default(10);
        for (let t = 0, r = new i.default(5); t < e.NEAR_NOMINATION_EXP; t++, r = r.mul(s))
          o[t] = r;
        (e.formatNearAmount = function (t, r = e.NEAR_NOMINATION_EXP) {
          const n = new i.default(t, 10);
          if (r !== e.NEAR_NOMINATION_EXP) {
            const t = e.NEAR_NOMINATION_EXP - r - 1;
            t > 0 && n.iadd(o[t]);
          }
          const s = (t = n.toString()).substring(0, t.length - e.NEAR_NOMINATION_EXP) || "0",
            a = t
              .substring(t.length - e.NEAR_NOMINATION_EXP)
              .padStart(e.NEAR_NOMINATION_EXP, "0")
              .substring(0, r);
          return `${(function (t) {
            const e = /(-?\d+)(\d{3})/;
            while (e.test(t)) t = t.replace(e, "$1,$2");
            return t;
          })(s)}.${a}`.replace(/\.?0*$/, "");
        }),
          (e.parseNearAmount = function (t) {
            if (!t) return null;
            const r = (t = t.replace(/,/g, "").trim()).split("."),
              n = r[0],
              i = r[1] || "";
            if (r.length > 2 || i.length > e.NEAR_NOMINATION_EXP)
              throw new Error(`Cannot parse '${t}' as NEAR amount`);
            return (function (t) {
              if ("" === (t = t.replace(/^0+/, ""))) return "0";
              return t;
            })(n + i.padEnd(e.NEAR_NOMINATION_EXP, "0"));
          });
      },
      64481: function (t, e, r) {
        var n =
            (this && this.__createBinding) ||
            (Object.create
              ? function (t, e, r, n) {
                  void 0 === n && (n = r),
                    Object.defineProperty(t, n, {
                      enumerable: !0,
                      get: function () {
                        return e[r];
                      },
                    });
                }
              : function (t, e, r, n) {
                  void 0 === n && (n = r), (t[n] = e[r]);
                }),
          i =
            (this && this.__setModuleDefault) ||
            (Object.create
              ? function (t, e) {
                  Object.defineProperty(t, "default", {
                    enumerable: !0,
                    value: e,
                  });
                }
              : function (t, e) {
                  t.default = e;
                }),
          o =
            (this && this.__importStar) ||
            function (t) {
              if (t && t.__esModule) return t;
              var e = {};
              if (null != t)
                for (var r in t) "default" !== r && Object.hasOwnProperty.call(t, r) && n(e, t, r);
              return i(e, t), e;
            };
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.logWarning =
            e.rpc_errors =
            e.KeyPairEd25519 =
            e.KeyPair =
            e.PublicKey =
            e.format =
            e.enums =
            e.web =
            e.serialize =
            e.key_pair =
              void 0);
        const s = o(r(56393));
        e.key_pair = s;
        const a = o(r(39803));
        e.serialize = a;
        const c = o(r(73490));
        e.web = c;
        const u = o(r(93221));
        e.enums = u;
        const h = o(r(77084));
        e.format = h;
        const l = o(r(9743));
        e.rpc_errors = l;
        const f = r(56393);
        Object.defineProperty(e, "PublicKey", {
          enumerable: !0,
          get: function () {
            return f.PublicKey;
          },
        }),
          Object.defineProperty(e, "KeyPair", {
            enumerable: !0,
            get: function () {
              return f.KeyPair;
            },
          }),
          Object.defineProperty(e, "KeyPairEd25519", {
            enumerable: !0,
            get: function () {
              return f.KeyPairEd25519;
            },
          });
        const d = r(44497);
        Object.defineProperty(e, "logWarning", {
          enumerable: !0,
          get: function () {
            return d.logWarning;
          },
        });
      },
      56393: function (t, e, r) {
        var n =
          (this && this.__importDefault) ||
          function (t) {
            return t && t.__esModule
              ? t
              : {
                  default: t,
                };
          };
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.KeyPairEd25519 = e.KeyPair = e.PublicKey = e.KeyType = void 0);
        const i = n(r(50780)),
          o = r(39803),
          s = r(93221);
        var a;

        function c(t) {
          if ("ed25519" === t.toLowerCase()) return a.ED25519;
          throw new Error(`Unknown key type ${t}`);
        }
        !(function (t) {
          t[(t.ED25519 = 0)] = "ED25519";
        })((a = e.KeyType || (e.KeyType = {})));
        class u extends s.Assignable {
          static from(t) {
            return "string" == typeof t ? u.fromString(t) : t;
          }
          static fromString(t) {
            const e = t.split(":");
            if (1 === e.length)
              return new u({
                keyType: a.ED25519,
                data: o.base_decode(e[0]),
              });
            if (2 === e.length)
              return new u({
                keyType: c(e[0]),
                data: o.base_decode(e[1]),
              });
            throw new Error("Invalid encoded key format, must be <curve>:<encoded key>");
          }
          toString() {
            return `${(function (t) {
              if (t === a.ED25519) return "ed25519";
              throw new Error(`Unknown key type ${t}`);
            })(this.keyType)}:${o.base_encode(this.data)}`;
          }
        }
        e.PublicKey = u;
        class h {
          static fromRandom(t) {
            if ("ED25519" === t.toUpperCase()) return l.fromRandom();
            throw new Error(`Unknown curve ${t}`);
          }
          static fromString(t) {
            const e = t.split(":");
            if (1 === e.length) return new l(e[0]);
            if (2 === e.length) {
              if ("ED25519" === e[0].toUpperCase()) return new l(e[1]);
              throw new Error(`Unknown curve: ${e[0]}`);
            }
            throw new Error("Invalid encoded key format, must be <curve>:<encoded key>");
          }
        }
        e.KeyPair = h;
        class l extends h {
          constructor(t) {
            super();
            const e = i.default.sign.keyPair.fromSecretKey(o.base_decode(t));
            (this.publicKey = new u({
              keyType: a.ED25519,
              data: e.publicKey,
            })),
              (this.secretKey = t);
          }
          static fromRandom() {
            const t = i.default.sign.keyPair();
            return new l(o.base_encode(t.secretKey));
          }
          sign(t) {
            return {
              signature: i.default.sign.detached(t, o.base_decode(this.secretKey)),
              publicKey: this.publicKey,
            };
          }
          verify(t, e) {
            return i.default.sign.detached.verify(t, e, this.publicKey.data);
          }
          toString() {
            return `ed25519:${this.secretKey}`;
          }
          getPublicKey() {
            return this.publicKey;
          }
        }
        e.KeyPairEd25519 = l;
      },
      9743: function (t, e, r) {
        var n =
          (this && this.__importDefault) ||
          function (t) {
            return t && t.__esModule
              ? t
              : {
                  default: t,
                };
          };
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.getErrorTypeFromErrorMessage =
            e.formatError =
            e.parseResultError =
            e.parseRpcError =
            e.ServerError =
              void 0);
        const i = n(r(466)),
          o = n(r(56527)),
          s = n(r(87930)),
          a = r(71137),
          c = r(44497),
          u = {
            formatNear: () => (t, e) => a.utils.format.formatNearAmount(e(t)),
          };
        class h extends c.TypedError {}
        e.ServerError = h;
        class l extends h {}

        function f(t) {
          const e = {},
            r = p(t, o.default.schema, e, ""),
            n = new h(d(r, e), r);
          return Object.assign(n, e), n;
        }

        function d(t, e) {
          return "string" == typeof s.default[t]
            ? i.default.render(s.default[t], {
                ...e,
                ...u,
              })
            : JSON.stringify(e);
        }

        function p(t, e, r, n) {
          let i, o, s;
          for (const r in e) {
            if (((a = t[r]), "[object String]" === Object.prototype.toString.call(a))) return t[r];
            if (y(t[r])) (i = t[r]), (o = e[r]), (s = r);
            else {
              if (!y(t.kind) || !y(t.kind[r])) continue;
              (i = t.kind[r]), (o = e[r]), (s = r);
            }
          }
          var a;
          if (i && o) {
            for (const t of Object.keys(o.props)) r[t] = i[t];
            return p(i, e, r, s);
          }
          return (r.kind = t), n;
        }

        function y(t) {
          return "[object Object]" === Object.prototype.toString.call(t);
        }
        (e.parseRpcError = f),
          (e.parseResultError = function (t) {
            const e = f(t.status.Failure),
              r = new l();
            return (
              Object.assign(r, e),
              (r.type = e.type),
              (r.message = e.message),
              (r.transaction_outcome = t.transaction_outcome),
              r
            );
          }),
          (e.formatError = d),
          (e.getErrorTypeFromErrorMessage = function (t) {
            switch (!0) {
              case /^account .*? does not exist while viewing$/.test(t):
              case /^Account .*? doesn't exist$/.test(t):
                return "AccountDoesNotExist";
              case /^access key .*? does not exist while viewing$/.test(t):
                return "AccessKeyDoesNotExist";
              case /wasm execution failed with error: FunctionCallError\(CompilationError\(CodeDoesNotExist/.test(
                t,
              ):
                return "CodeDoesNotExist";
              case /Transaction nonce \d+ must be larger than nonce of the used access key \d+/.test(
                t,
              ):
                return "InvalidNonce";
              default:
                return "UntypedError";
            }
          });
      },
      39803: (t, e, r) => {
        Object.defineProperty(e, "__esModule", {
          value: !0,
        });
        var n = r(25532);
        Object.defineProperty(e, "base_encode", {
          enumerable: !0,
          get: function () {
            return n.baseEncode;
          },
        }),
          Object.defineProperty(e, "base_decode", {
            enumerable: !0,
            get: function () {
              return n.baseDecode;
            },
          }),
          Object.defineProperty(e, "serialize", {
            enumerable: !0,
            get: function () {
              return n.serialize;
            },
          }),
          Object.defineProperty(e, "deserialize", {
            enumerable: !0,
            get: function () {
              return n.deserialize;
            },
          }),
          Object.defineProperty(e, "BorshError", {
            enumerable: !0,
            get: function () {
              return n.BorshError;
            },
          }),
          Object.defineProperty(e, "BinaryWriter", {
            enumerable: !0,
            get: function () {
              return n.BinaryWriter;
            },
          }),
          Object.defineProperty(e, "BinaryReader", {
            enumerable: !0,
            get: function () {
              return n.BinaryReader;
            },
          });
      },
      73490: function (t, e, r) {
        var n =
          (this && this.__importDefault) ||
          function (t) {
            return t && t.__esModule
              ? t
              : {
                  default: t,
                };
          };
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.fetchJson = void 0);
        const i = n(r(60969)),
          o = n(r(12707)),
          s = r(84920),
          a = r(44497);
        e.fetchJson = async function (t, e) {
          let r = null;
          r = "string" == typeof t ? t : t.url;
          const n = await o.default(1e3, 10, 1.5, async () => {
            try {
              const t = await fetch(r, {
                method: e ? "POST" : "GET",
                body: e || void 0,
                headers: {
                  "Content-Type": "application/json; charset=utf-8",
                },
              });
              if (!t.ok) {
                if (503 === t.status)
                  return (
                    a.logWarning(`Retrying HTTP request for ${r} as it's not available now`), null
                  );
                throw i.default(t.status, await t.text());
              }
              return t;
            } catch (t) {
              if (t.toString().includes("FetchError") || t.toString().includes("Failed to fetch"))
                return a.logWarning(`Retrying HTTP request for ${r} because of error: ${t}`), null;
              throw t;
            }
          });
          if (!n) throw new s.TypedError(`Exceeded 10 attempts for ${r}.`, "RetriesExceeded");
          return await n.json();
        };
      },
      90296: function (t, e, r) {
        var n =
          (this && this.__importDefault) ||
          function (t) {
            return t && t.__esModule
              ? t
              : {
                  default: t,
                };
          };
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.diffEpochValidators = e.findSeatPrice = void 0);
        const i = n(r(13550));
        (e.findSeatPrice = function (t, e) {
          const r = t.map((t) => new i.default(t.stake, 10)).sort((t, e) => t.cmp(e)),
            n = new i.default(e),
            o = r.reduce((t, e) => t.add(e));
          if (o.lt(n)) throw new Error("Stakes are below seats");
          let s = new i.default(1),
            a = o.add(new i.default(1));
          while (!s.eq(a.sub(new i.default(1)))) {
            const t = s.add(a).div(new i.default(2));
            let e = !1,
              o = new i.default(0);
            for (let i = 0; i < r.length; ++i)
              if (((o = o.add(r[i].div(t))), o.gte(n))) {
                (s = t), (e = !0);
                break;
              }
            e || (a = t);
          }
          return s;
        }),
          (e.diffEpochValidators = function (t, e) {
            const r = new Map();
            t.forEach((t) => r.set(t.account_id, t));
            const n = new Set(e.map((t) => t.account_id));
            return {
              newValidators: e.filter((t) => !r.has(t.account_id)),
              removedValidators: t.filter((t) => !n.has(t.account_id)),
              changedValidators: e
                .filter((t) => r.has(t.account_id) && r.get(t.account_id).stake != t.stake)
                .map((t) => ({
                  current: r.get(t.account_id),
                  next: t,
                })),
            };
          });
      },
      39802: function (t, e, r) {
        var n = r(48764).Buffer,
          i =
            (this && this.__importDefault) ||
            function (t) {
              return t && t.__esModule
                ? t
                : {
                    default: t,
                  };
            };
        Object.defineProperty(e, "__esModule", {
          value: !0,
        }),
          (e.ConnectedWalletAccount = e.WalletAccount = e.WalletConnection = void 0);
        const o = i(r(83686)),
          s = r(45180),
          a = r(49521),
          c = r(64481),
          u = r(25532),
          h = r(25532),
          l = "pending_key";
        class f {
          constructor(t, e) {
            this._near = t;
            const r = e + "_wallet_auth_key",
              n = JSON.parse(window.localStorage.getItem(r));
            (this._networkId = t.config.networkId),
              (this._walletBaseUrl = t.config.walletUrl),
              (e = e || t.config.contractName || "default"),
              (this._keyStore = t.connection.signer.keyStore),
              (this._authData = n || {
                allKeys: [],
              }),
              (this._authDataKey = r),
              this.isSignedIn() || this._completeSignInWithAccessKey();
          }
          isSignedIn() {
            return !!this._authData.accountId;
          }
          getAccountId() {
            return this._authData.accountId || "";
          }
          async requestSignIn(t = {}, e, r, n) {
            let i;
            if ("string" == typeof t) {
              o.default("requestSignIn(contractId, title)")(
                "`title` ignored; use `requestSignIn({ contractId, methodNames, successUrl, failureUrl })` instead",
              ),
                (i = {
                  contractId: t,
                  successUrl: r,
                  failureUrl: n,
                });
            } else i = t;
            const s = new URL(window.location.href),
              a = new URL(this._walletBaseUrl + "/login/");
            if (
              (a.searchParams.set("success_url", i.successUrl || s.href),
              a.searchParams.set("failure_url", i.failureUrl || s.href),
              i.contractId)
            ) {
              const t = await this._near.account(i.contractId);
              await t.state(), a.searchParams.set("contract_id", i.contractId);
              const e = c.KeyPair.fromRandom("ed25519");
              a.searchParams.set("public_key", e.getPublicKey().toString()),
                await this._keyStore.setKey(this._networkId, l + e.getPublicKey(), e);
            }
            i.methodNames &&
              i.methodNames.forEach((t) => {
                a.searchParams.append("methodNames", t);
              }),
              window.location.assign(a.toString());
          }
          async requestSignTransactions(...t) {
            if (Array.isArray(t[0])) {
              return (
                o.default(
                  "WalletConnection.requestSignTransactions(transactions, callbackUrl, meta)",
                )(
                  "use `WalletConnection.requestSignTransactions(RequestSignTransactionsOptions)` instead",
                ),
                this._requestSignTransactions({
                  transactions: t[0],
                  callbackUrl: t[1],
                  meta: t[2],
                })
              );
            }
            return this._requestSignTransactions(t[0]);
          }
          async _requestSignTransactions({ transactions: t, meta: e, callbackUrl: r }) {
            const i = new URL(window.location.href),
              o = new URL("sign", this._walletBaseUrl);
            o.searchParams.set(
              "transactions",
              t
                .map((t) => h.serialize(a.SCHEMA, t))
                .map((t) => n.from(t).toString("base64"))
                .join(","),
            ),
              o.searchParams.set("callbackUrl", r || i.href),
              e && o.searchParams.set("meta", e),
              window.location.assign(o.toString());
          }
          async _completeSignInWithAccessKey() {
            const t = new URL(window.location.href),
              e = t.searchParams.get("public_key") || "",
              r = (t.searchParams.get("all_keys") || "").split(","),
              n = t.searchParams.get("account_id") || "";
            n &&
              ((this._authData = {
                accountId: n,
                allKeys: r,
              }),
              window.localStorage.setItem(this._authDataKey, JSON.stringify(this._authData)),
              e && (await this._moveKeyFromTempToPermanent(n, e))),
              t.searchParams.delete("public_key"),
              t.searchParams.delete("all_keys"),
              t.searchParams.delete("account_id"),
              window.history.replaceState({}, document.title, t.toString());
          }
          async _moveKeyFromTempToPermanent(t, e) {
            const r = await this._keyStore.getKey(this._networkId, l + e);
            await this._keyStore.setKey(this._networkId, t, r),
              await this._keyStore.removeKey(this._networkId, l + e);
          }
          signOut() {
            (this._authData = {}), window.localStorage.removeItem(this._authDataKey);
          }
          account() {
            return (
              this._connectedAccount ||
                (this._connectedAccount = new d(
                  this,
                  this._near.connection,
                  this._authData.accountId,
                )),
              this._connectedAccount
            );
          }
        }
        (e.WalletConnection = f), (e.WalletAccount = f);
        class d extends s.Account {
          constructor(t, e, r) {
            super(e, r), (this.walletConnection = t);
          }
          signAndSendTransaction(...t) {
            return "string" == typeof t[0]
              ? this._signAndSendTransaction({
                  receiverId: t[0],
                  actions: t[1],
                })
              : this._signAndSendTransaction(t[0]);
          }
          async _signAndSendTransaction({
            receiverId: t,
            actions: e,
            walletMeta: r,
            walletCallbackUrl: n = window.location.href,
          }) {
            const i = await this.connection.signer.getPublicKey(
              this.accountId,
              this.connection.networkId,
            );
            let o = await this.accessKeyForTransaction(t, e, i);
            if (!o) throw new Error(`Cannot find matching key for transaction sent to ${t}`);
            if (i && i.toString() === o.public_key)
              try {
                return await super.signAndSendTransaction({
                  receiverId: t,
                  actions: e,
                });
              } catch (r) {
                if ("NotEnoughAllowance" !== r.type) throw r;
                o = await this.accessKeyForTransaction(t, e);
              }
            const s = await this.connection.provider.block({
                finality: "final",
              }),
              h = u.baseDecode(s.header.hash),
              l = c.PublicKey.from(o.public_key),
              f = o.access_key.nonce + 1,
              d = a.createTransaction(this.accountId, l, t, f, e, h);
            return (
              await this.walletConnection.requestSignTransactions({
                transactions: [d],
                meta: r,
                callbackUrl: n,
              }),
              new Promise((t, e) => {
                setTimeout(() => {
                  e(new Error("Failed to redirect to sign transaction"));
                }, 1e3);
              })
            );
          }
          async accessKeyMatchesTransaction(t, e, r) {
            const {
              access_key: { permission: n },
            } = t;
            if ("FullAccess" === n) return !0;
            if (n.FunctionCall) {
              const { receiver_id: t, method_names: i } = n.FunctionCall;
              if (t === this.accountId && i.includes("add_request_and_confirm")) return !0;
              if (t === e) {
                if (1 !== r.length) return !1;
                const [{ functionCall: t }] = r;
                return (
                  t &&
                  (!t.deposit || "0" === t.deposit.toString()) &&
                  (0 === i.length || i.includes(t.methodName))
                );
              }
            }
            return !1;
          }
          async accessKeyForTransaction(t, e, r) {
            const n = await this.getAccessKeys();
            if (r) {
              const i = n.find((t) => t.public_key.toString() === r.toString());
              if (i && (await this.accessKeyMatchesTransaction(i, t, e))) return i;
            }
            const i = this.walletConnection._authData.allKeys;
            for (const r of n)
              if (
                -1 !== i.indexOf(r.public_key) &&
                (await this.accessKeyMatchesTransaction(r, t, e))
              )
                return r;
            return null;
          }
        }
        e.ConnectedWalletAccount = d;
      },
      83686: (t) => {
        /*!
         * depd
         * Copyright(c) 2015 Douglas Christopher Wilson
         * MIT Licensed
         */
        function e(t, e) {
          if ("function" != typeof t) throw new TypeError("argument fn must be a function");
          return t;
        }

        function r(t, e, r) {
          if (!t || ("object" != typeof t && "function" != typeof t))
            throw new TypeError("argument obj must be object");
          var n = Object.getOwnPropertyDescriptor(t, e);
          if (!n) throw new TypeError("must call property on owner object");
          if (!n.configurable) throw new TypeError("property must be configurable");
        }
        t.exports = function (t) {
          if (!t) throw new TypeError("argument namespace is required");

          function n(t) {}
          return (
            (n._file = void 0),
            (n._ignored = !0),
            (n._namespace = t),
            (n._traced = !1),
            (n._warned = Object.create(null)),
            (n.function = e),
            (n.property = r),
            n
          );
        };
      },
      60969: (t, e, r) => {
        /*!
         * http-errors
         * Copyright(c) 2014 Jonathan Ong
         * Copyright(c) 2016 Douglas Christopher Wilson
         * MIT Licensed
         */
        var n,
          i = r(17254)("http-errors"),
          o = r(79358),
          s = r(54917),
          a = r(35717),
          c = r(72953);

        function u(t) {
          return Number(String(t).charAt(0) + "00");
        }

        function h(t, e) {
          var r = Object.getOwnPropertyDescriptor(t, "name");
          r && r.configurable && ((r.value = e), Object.defineProperty(t, "name", r));
        }

        function l(t) {
          return "Error" !== t.substr(-5) ? t + "Error" : t;
        }
        (t.exports = function t() {
          for (var e, r, n = 500, o = {}, a = 0; a < arguments.length; a++) {
            var c = arguments[a];
            if (c instanceof Error) n = (e = c).status || e.statusCode || n;
            else
              switch (typeof c) {
                case "string":
                  r = c;
                  break;
                case "number":
                  (n = c),
                    0 !== a &&
                      i("non-first-argument status code; replace with createError(" + c + ", ...)");
                  break;
                case "object":
                  o = c;
              }
          }
          "number" == typeof n &&
            (n < 400 || n >= 600) &&
            i("non-error status code; use only 4xx or 5xx status codes");
          ("number" != typeof n || (!s[n] && (n < 400 || n >= 600))) && (n = 500);
          var h = t[n] || t[u(n)];
          e || ((e = h ? new h(r) : new Error(r || s[n])), Error.captureStackTrace(e, t));
          (h && e instanceof h && e.status === n) ||
            ((e.expose = n < 500), (e.status = e.statusCode = n));
          for (var l in o) "status" !== l && "statusCode" !== l && (e[l] = o[l]);
          return e;
        }),
          (t.exports.HttpError = (function () {
            function t() {
              throw new TypeError("cannot construct abstract class");
            }
            return a(t, Error), t;
          })()),
          (t.exports.isHttpError =
            ((n = t.exports.HttpError),
            function (t) {
              return (
                !(!t || "object" != typeof t) &&
                (t instanceof n ||
                  (t instanceof Error &&
                    "boolean" == typeof t.expose &&
                    "number" == typeof t.statusCode &&
                    t.status === t.statusCode))
              );
            })),
          (function (t, e, r) {
            e.forEach(function (e) {
              var n,
                i = c(s[e]);
              switch (u(e)) {
                case 400:
                  n = (function (t, e, r) {
                    var n = l(e);

                    function i(t) {
                      var e = null != t ? t : s[r],
                        a = new Error(e);
                      return (
                        Error.captureStackTrace(a, i),
                        o(a, i.prototype),
                        Object.defineProperty(a, "message", {
                          enumerable: !0,
                          configurable: !0,
                          value: e,
                          writable: !0,
                        }),
                        Object.defineProperty(a, "name", {
                          enumerable: !1,
                          configurable: !0,
                          value: n,
                          writable: !0,
                        }),
                        a
                      );
                    }
                    return (
                      a(i, t),
                      h(i, n),
                      (i.prototype.status = r),
                      (i.prototype.statusCode = r),
                      (i.prototype.expose = !0),
                      i
                    );
                  })(r, i, e);
                  break;
                case 500:
                  n = (function (t, e, r) {
                    var n = l(e);

                    function i(t) {
                      var e = null != t ? t : s[r],
                        a = new Error(e);
                      return (
                        Error.captureStackTrace(a, i),
                        o(a, i.prototype),
                        Object.defineProperty(a, "message", {
                          enumerable: !0,
                          configurable: !0,
                          value: e,
                          writable: !0,
                        }),
                        Object.defineProperty(a, "name", {
                          enumerable: !1,
                          configurable: !0,
                          value: n,
                          writable: !0,
                        }),
                        a
                      );
                    }
                    return (
                      a(i, t),
                      h(i, n),
                      (i.prototype.status = r),
                      (i.prototype.statusCode = r),
                      (i.prototype.expose = !1),
                      i
                    );
                  })(r, i, e);
              }
              n && ((t[e] = n), (t[i] = n));
            }),
              (t["I'mateapot"] = i.function(t.ImATeapot, '"I\'mateapot"; use "ImATeapot" instead'));
          })(t.exports, s.codes, t.exports.HttpError);
      },
      17254: (t) => {
        /*!
         * depd
         * Copyright(c) 2015 Douglas Christopher Wilson
         * MIT Licensed
         */
        function e(t, e) {
          if ("function" != typeof t) throw new TypeError("argument fn must be a function");
          return t;
        }

        function r(t, e, r) {
          if (!t || ("object" != typeof t && "function" != typeof t))
            throw new TypeError("argument obj must be object");
          var n = Object.getOwnPropertyDescriptor(t, e);
          if (!n) throw new TypeError("must call property on owner object");
          if (!n.configurable) throw new TypeError("property must be configurable");
        }
        t.exports = function (t) {
          if (!t) throw new TypeError("argument namespace is required");

          function n(t) {}
          return (
            (n._file = void 0),
            (n._ignored = !0),
            (n._namespace = t),
            (n._traced = !1),
            (n._warned = Object.create(null)),
            (n.function = e),
            (n.property = r),
            n
          );
        };
      },
      79358: (t) => {
        t.exports =
          Object.setPrototypeOf ||
          ({
            __proto__: [],
          } instanceof Array
            ? function (t, e) {
                return (t.__proto__ = e), t;
              }
            : function (t, e) {
                for (var r in e) Object.prototype.hasOwnProperty.call(t, r) || (t[r] = e[r]);
                return t;
              });
      },
      61589: (t, e, r) => {
        r(82894), (t.exports = r(71510));
      },
      32285: (t) => {
        var e = function () {
          var t = Object.create({
            Source: Object,
            config: {},
            buildArgs: [],
          });

          function r(e) {
            var r = "config";
            if (e instanceof Function) r = "Source";
            else if (e instanceof Array) r = "buildArgs";
            else {
              if (!(e instanceof Object)) throw new Error("Invalid configuration option.");
              r = "config";
            }
            if (t.hasOwnProperty(r)) throw new Error("Duplicated configuration option: " + r + ".");
            t[r] = e;
          }
          for (var n = 0, i = arguments.length; n < i; ++n) r(arguments[n]);
          var o = t.Source,
            s = t.config,
            a = t.buildArgs;
          return (o.extend || e.extend).call(o, s, a);
        };
        (e.factory = function () {
          return function () {
            this.build instanceof Function && this.build.apply(this, arguments),
              this.init instanceof Function && this.init.apply(this, arguments);
          };
        }),
          (e.extend = function (t, r) {
            var n;
            return (
              t || (t = {}),
              t.prototype instanceof Object && t.prototype.constructor !== Object
                ? (n = t.prototype.constructor)
                : t.factory instanceof Function && (n = t.factory.call(this)),
              ((n = (this.clone || e.clone).call(this, n, r)).merge || e.merge).call(n, t),
              n
            );
          }),
          (e.prototype.extend = function (t, r) {
            var n = (this.clone || e.prototype.clone).apply(this, r);
            return (n.merge || e.prototype.merge).call(n, t), n;
          }),
          (e.clone = function (t, r) {
            for (var i in (t instanceof Function || (t = (this.factory || e.factory).call(this)),
            (t.prototype = (this.prototype.clone || e.prototype.clone).apply(
              this.prototype,
              r || [],
            )),
            (t.prototype.constructor = t),
            this))
              "prototype" !== i && (t[i] = this[i]);
            return t;
          }),
          (e.prototype.clone = function () {
            var e = Object.create(this);
            return e.build instanceof Function && e.build.apply(e, arguments), e;
          }),
          (e.merge = function (t) {
            for (var n in t) "prototype" !== n && (this[n] = t[n]);
            return (
              t.prototype instanceof Object &&
                (this.prototype.merge || e.prototype.merge).call(this.prototype, t.prototype),
              this
            );
          }),
          (e.prototype.merge = function (t) {
            for (var e in t) "constructor" !== e && (this[e] = t[e]);
            return this;
          }),
          (e.absorb = function (t) {
            for (var n in t)
              "prototype" === n ||
                (void 0 !== this[n] && this[n] !== Function.prototype[n]) ||
                (this[n] = t[n]);
            return (
              t.prototype instanceof Object &&
                (this.prototype.absorb || e.prototype.absorb).call(this.prototype, t.prototype),
              this
            );
          }),
          (e.prototype.absorb = function (t) {
            for (var r in t)
              "constructor" === r ||
                (void 0 !== this[r] && this[r] !== Object.prototype[r]) ||
                (this[r] = t[r]);
            return this;
          }),
          (e.getAncestor = function () {
            if (this !== this.prototype.constructor) return this.prototype.constructor;
          }),
          (e.newInstance = function () {
            var e = Object.create(this.prototype);
            return this.apply(e, arguments), e;
          }),
          (t.exports = e);
      },
      68503: (t) => {
        t.exports = function () {
          throw new Error("Not implemented.");
        };
      },
      71510: (t, e, r) => {
        t.exports = {
          Class: r(32285),
          abstractMethod: r(68503),
        };
      },
      34155: (t) => {
        var e,
          r,
          n = (t.exports = {});

        function i() {
          throw new Error("setTimeout has not been defined");
        }

        function o() {
          throw new Error("clearTimeout has not been defined");
        }

        function s(t) {
          if (e === setTimeout) return setTimeout(t, 0);
          if ((e === i || !e) && setTimeout) return (e = setTimeout), setTimeout(t, 0);
          try {
            return e(t, 0);
          } catch (r) {
            try {
              return e.call(null, t, 0);
            } catch (r) {
              return e.call(this, t, 0);
            }
          }
        }
        !(function () {
          try {
            e = "function" == typeof setTimeout ? setTimeout : i;
          } catch (t) {
            e = i;
          }
          try {
            r = "function" == typeof clearTimeout ? clearTimeout : o;
          } catch (t) {
            r = o;
          }
        })();
        var a,
          c = [],
          u = !1,
          h = -1;

        function l() {
          u && a && ((u = !1), a.length ? (c = a.concat(c)) : (h = -1), c.length && f());
        }

        function f() {
          if (!u) {
            var t = s(l);
            u = !0;
            for (var e = c.length; e; ) {
              for (a = c, c = []; ++h < e; ) a && a[h].run();
              (h = -1), (e = c.length);
            }
            (a = null),
              (u = !1),
              (function (t) {
                if (r === clearTimeout) return clearTimeout(t);
                if ((r === o || !r) && clearTimeout) return (r = clearTimeout), clearTimeout(t);
                try {
                  r(t);
                } catch (e) {
                  try {
                    return r.call(null, t);
                  } catch (e) {
                    return r.call(this, t);
                  }
                }
              })(t);
          }
        }

        function d(t, e) {
          (this.fun = t), (this.array = e);
        }

        function p() {}
        (n.nextTick = function (t) {
          var e = new Array(arguments.length - 1);
          if (arguments.length > 1)
            for (var r = 1; r < arguments.length; r++) e[r - 1] = arguments[r];
          c.push(new d(t, e)), 1 !== c.length || u || s(f);
        }),
          (d.prototype.run = function () {
            this.fun.apply(null, this.array);
          }),
          (n.title = "browser"),
          (n.browser = !0),
          (n.env = {}),
          (n.argv = []),
          (n.version = ""),
          (n.versions = {}),
          (n.on = p),
          (n.addListener = p),
          (n.once = p),
          (n.off = p),
          (n.removeListener = p),
          (n.removeAllListeners = p),
          (n.emit = p),
          (n.prependListener = p),
          (n.prependOnceListener = p),
          (n.listeners = function (t) {
            return [];
          }),
          (n.binding = function (t) {
            throw new Error("process.binding is not supported");
          }),
          (n.cwd = function () {
            return "/";
          }),
          (n.chdir = function (t) {
            throw new Error("process.chdir is not supported");
          }),
          (n.umask = function () {
            return 0;
          });
      },
      35666: (t) => {
        var e = (function (t) {
          var e,
            r = Object.prototype,
            n = r.hasOwnProperty,
            i = "function" == typeof Symbol ? Symbol : {},
            o = i.iterator || "@@iterator",
            s = i.asyncIterator || "@@asyncIterator",
            a = i.toStringTag || "@@toStringTag";

          function c(t, e, r) {
            return (
              Object.defineProperty(t, e, {
                value: r,
                enumerable: !0,
                configurable: !0,
                writable: !0,
              }),
              t[e]
            );
          }
          try {
            c({}, "");
          } catch (t) {
            c = function (t, e, r) {
              return (t[e] = r);
            };
          }

          function u(t, e, r, n) {
            var i = e && e.prototype instanceof m ? e : m,
              o = Object.create(i.prototype),
              s = new x(n || []);
            return (
              (o._invoke = (function (t, e, r) {
                var n = l;
                return function (i, o) {
                  if (n === d) throw new Error("Generator is already running");
                  if (n === p) {
                    if ("throw" === i) throw o;
                    return O();
                  }
                  for (r.method = i, r.arg = o; ; ) {
                    var s = r.delegate;
                    if (s) {
                      var a = S(s, r);
                      if (a) {
                        if (a === y) continue;
                        return a;
                      }
                    }
                    if ("next" === r.method) r.sent = r._sent = r.arg;
                    else if ("throw" === r.method) {
                      if (n === l) throw ((n = p), r.arg);
                      r.dispatchException(r.arg);
                    } else "return" === r.method && r.abrupt("return", r.arg);
                    n = d;
                    var c = h(t, e, r);
                    if ("normal" === c.type) {
                      if (((n = r.done ? p : f), c.arg === y)) continue;
                      return {
                        value: c.arg,
                        done: r.done,
                      };
                    }
                    "throw" === c.type && ((n = p), (r.method = "throw"), (r.arg = c.arg));
                  }
                };
              })(t, r, s)),
              o
            );
          }

          function h(t, e, r) {
            try {
              return {
                type: "normal",
                arg: t.call(e, r),
              };
            } catch (t) {
              return {
                type: "throw",
                arg: t,
              };
            }
          }
          t.wrap = u;
          var l = "suspendedStart",
            f = "suspendedYield",
            d = "executing",
            p = "completed",
            y = {};

          function m() {}

          function g() {}

          function w() {}
          var v = {};
          c(v, o, function () {
            return this;
          });
          var b = Object.getPrototypeOf,
            _ = b && b(b(T([])));
          _ && _ !== r && n.call(_, o) && (v = _);
          var E = (w.prototype = m.prototype = Object.create(v));

          function A(t) {
            ["next", "throw", "return"].forEach(function (e) {
              c(t, e, function (t) {
                return this._invoke(e, t);
              });
            });
          }

          function M(t, e) {
            function r(i, o, s, a) {
              var c = h(t[i], t, o);
              if ("throw" !== c.type) {
                var u = c.arg,
                  l = u.value;
                return l && "object" == typeof l && n.call(l, "__await")
                  ? e.resolve(l.__await).then(
                      function (t) {
                        r("next", t, s, a);
                      },
                      function (t) {
                        r("throw", t, s, a);
                      },
                    )
                  : e.resolve(l).then(
                      function (t) {
                        (u.value = t), s(u);
                      },
                      function (t) {
                        return r("throw", t, s, a);
                      },
                    );
              }
              a(c.arg);
            }
            var i;
            this._invoke = function (t, n) {
              function o() {
                return new e(function (e, i) {
                  r(t, n, e, i);
                });
              }
              return (i = i ? i.then(o, o) : o());
            };
          }

          function S(t, r) {
            var n = t.iterator[r.method];
            if (n === e) {
              if (((r.delegate = null), "throw" === r.method)) {
                if (
                  t.iterator.return &&
                  ((r.method = "return"), (r.arg = e), S(t, r), "throw" === r.method)
                )
                  return y;
                (r.method = "throw"),
                  (r.arg = new TypeError("The iterator does not provide a 'throw' method"));
              }
              return y;
            }
            var i = h(n, t.iterator, r.arg);
            if ("throw" === i.type)
              return (r.method = "throw"), (r.arg = i.arg), (r.delegate = null), y;
            var o = i.arg;
            return o
              ? o.done
                ? ((r[t.resultName] = o.value),
                  (r.next = t.nextLoc),
                  "return" !== r.method && ((r.method = "next"), (r.arg = e)),
                  (r.delegate = null),
                  y)
                : o
              : ((r.method = "throw"),
                (r.arg = new TypeError("iterator result is not an object")),
                (r.delegate = null),
                y);
          }

          function I(t) {
            var e = {
              tryLoc: t[0],
            };
            1 in t && (e.catchLoc = t[1]),
              2 in t && ((e.finallyLoc = t[2]), (e.afterLoc = t[3])),
              this.tryEntries.push(e);
          }

          function k(t) {
            var e = t.completion || {};
            (e.type = "normal"), delete e.arg, (t.completion = e);
          }

          function x(t) {
            (this.tryEntries = [
              {
                tryLoc: "root",
              },
            ]),
              t.forEach(I, this),
              this.reset(!0);
          }

          function T(t) {
            if (t) {
              var r = t[o];
              if (r) return r.call(t);
              if ("function" == typeof t.next) return t;
              if (!isNaN(t.length)) {
                var i = -1,
                  s = function r() {
                    while (++i < t.length)
                      if (n.call(t, i)) return (r.value = t[i]), (r.done = !1), r;
                    return (r.value = e), (r.done = !0), r;
                  };
                return (s.next = s);
              }
            }
            return {
              next: O,
            };
          }

          function O() {
            return {
              value: e,
              done: !0,
            };
          }
          return (
            (g.prototype = w),
            c(E, "constructor", w),
            c(w, "constructor", g),
            (g.displayName = c(w, a, "GeneratorFunction")),
            (t.isGeneratorFunction = function (t) {
              var e = "function" == typeof t && t.constructor;
              return !!e && (e === g || "GeneratorFunction" === (e.displayName || e.name));
            }),
            (t.mark = function (t) {
              return (
                Object.setPrototypeOf
                  ? Object.setPrototypeOf(t, w)
                  : ((t.__proto__ = w), c(t, a, "GeneratorFunction")),
                (t.prototype = Object.create(E)),
                t
              );
            }),
            (t.awrap = function (t) {
              return {
                __await: t,
              };
            }),
            A(M.prototype),
            c(M.prototype, s, function () {
              return this;
            }),
            (t.AsyncIterator = M),
            (t.async = function (e, r, n, i, o) {
              void 0 === o && (o = Promise);
              var s = new M(u(e, r, n, i), o);
              return t.isGeneratorFunction(r)
                ? s
                : s.next().then(function (t) {
                    return t.done ? t.value : s.next();
                  });
            }),
            A(E),
            c(E, a, "Generator"),
            c(E, o, function () {
              return this;
            }),
            c(E, "toString", function () {
              return "[object Generator]";
            }),
            (t.keys = function (t) {
              var e = [];
              for (var r in t) e.push(r);
              return (
                e.reverse(),
                function r() {
                  while (e.length) {
                    var n = e.pop();
                    if (n in t) return (r.value = n), (r.done = !1), r;
                  }
                  return (r.done = !0), r;
                }
              );
            }),
            (t.values = T),
            (x.prototype = {
              constructor: x,
              reset: function (t) {
                if (
                  ((this.prev = 0),
                  (this.next = 0),
                  (this.sent = this._sent = e),
                  (this.done = !1),
                  (this.delegate = null),
                  (this.method = "next"),
                  (this.arg = e),
                  this.tryEntries.forEach(k),
                  !t)
                )
                  for (var r in this)
                    "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = e);
              },
              stop: function () {
                this.done = !0;
                var t = this.tryEntries[0].completion;
                if ("throw" === t.type) throw t.arg;
                return this.rval;
              },
              dispatchException: function (t) {
                if (this.done) throw t;
                var r = this;

                function i(n, i) {
                  return (
                    (a.type = "throw"),
                    (a.arg = t),
                    (r.next = n),
                    i && ((r.method = "next"), (r.arg = e)),
                    !!i
                  );
                }
                for (var o = this.tryEntries.length - 1; o >= 0; --o) {
                  var s = this.tryEntries[o],
                    a = s.completion;
                  if ("root" === s.tryLoc) return i("end");
                  if (s.tryLoc <= this.prev) {
                    var c = n.call(s, "catchLoc"),
                      u = n.call(s, "finallyLoc");
                    if (c && u) {
                      if (this.prev < s.catchLoc) return i(s.catchLoc, !0);
                      if (this.prev < s.finallyLoc) return i(s.finallyLoc);
                    } else if (c) {
                      if (this.prev < s.catchLoc) return i(s.catchLoc, !0);
                    } else {
                      if (!u) throw new Error("try statement without catch or finally");
                      if (this.prev < s.finallyLoc) return i(s.finallyLoc);
                    }
                  }
                }
              },
              abrupt: function (t, e) {
                for (var r = this.tryEntries.length - 1; r >= 0; --r) {
                  var i = this.tryEntries[r];
                  if (
                    i.tryLoc <= this.prev &&
                    n.call(i, "finallyLoc") &&
                    this.prev < i.finallyLoc
                  ) {
                    var o = i;
                    break;
                  }
                }
                o &&
                  ("break" === t || "continue" === t) &&
                  o.tryLoc <= e &&
                  e <= o.finallyLoc &&
                  (o = null);
                var s = o ? o.completion : {};
                return (
                  (s.type = t),
                  (s.arg = e),
                  o ? ((this.method = "next"), (this.next = o.finallyLoc), y) : this.complete(s)
                );
              },
              complete: function (t, e) {
                if ("throw" === t.type) throw t.arg;
                return (
                  "break" === t.type || "continue" === t.type
                    ? (this.next = t.arg)
                    : "return" === t.type
                      ? ((this.rval = this.arg = t.arg),
                        (this.method = "return"),
                        (this.next = "end"))
                      : "normal" === t.type && e && (this.next = e),
                  y
                );
              },
              finish: function (t) {
                for (var e = this.tryEntries.length - 1; e >= 0; --e) {
                  var r = this.tryEntries[e];
                  if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), k(r), y;
                }
              },
              catch: function (t) {
                for (var e = this.tryEntries.length - 1; e >= 0; --e) {
                  var r = this.tryEntries[e];
                  if (r.tryLoc === t) {
                    var n = r.completion;
                    if ("throw" === n.type) {
                      var i = n.arg;
                      k(r);
                    }
                    return i;
                  }
                }
                throw new Error("illegal catch attempt");
              },
              delegateYield: function (t, r, n) {
                return (
                  (this.delegate = {
                    iterator: T(t),
                    resultName: r,
                    nextLoc: n,
                  }),
                  "next" === this.method && (this.arg = e),
                  y
                );
              },
            }),
            t
          );
        })(t.exports);
        try {
          regeneratorRuntime = e;
        } catch (t) {
          "object" == typeof globalThis
            ? (globalThis.regeneratorRuntime = e)
            : Function("r", "regeneratorRuntime = r")(e);
        }
      },
      89509: (t, e, r) => {
        /*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
        var n = r(48764),
          i = n.Buffer;

        function o(t, e) {
          for (var r in t) e[r] = t[r];
        }

        function s(t, e, r) {
          return i(t, e, r);
        }
        i.from && i.alloc && i.allocUnsafe && i.allocUnsafeSlow
          ? (t.exports = n)
          : (o(n, e), (e.Buffer = s)),
          (s.prototype = Object.create(i.prototype)),
          o(i, s),
          (s.from = function (t, e, r) {
            if ("number" == typeof t) throw new TypeError("Argument must not be a number");
            return i(t, e, r);
          }),
          (s.alloc = function (t, e, r) {
            if ("number" != typeof t) throw new TypeError("Argument must be a number");
            var n = i(t);
            return void 0 !== e ? ("string" == typeof r ? n.fill(e, r) : n.fill(e)) : n.fill(0), n;
          }),
          (s.allocUnsafe = function (t) {
            if ("number" != typeof t) throw new TypeError("Argument must be a number");
            return i(t);
          }),
          (s.allocUnsafeSlow = function (t) {
            if ("number" != typeof t) throw new TypeError("Argument must be a number");
            return n.SlowBuffer(t);
          });
      },
      54917: (t, e, r) => {
        /*!
         * statuses
         * Copyright(c) 2014 Jonathan Ong
         * Copyright(c) 2016 Douglas Christopher Wilson
         * MIT Licensed
         */
        var n = r(50855);

        function i(t) {
          if ("number" == typeof t) {
            if (!i[t]) throw new Error("invalid status code: " + t);
            return t;
          }
          if ("string" != typeof t) throw new TypeError("code must be a number or string");
          var e = parseInt(t, 10);
          if (!isNaN(e)) {
            if (!i[e]) throw new Error("invalid status code: " + e);
            return e;
          }
          if (!(e = i[t.toLowerCase()])) throw new Error('invalid status message: "' + t + '"');
          return e;
        }
        (t.exports = i),
          (i.STATUS_CODES = n),
          (i.codes = (function (t, e) {
            var r = [];
            return (
              Object.keys(e).forEach(function (n) {
                var i = e[n],
                  o = Number(n);
                (t[o] = i), (t[i] = o), (t[i.toLowerCase()] = o), r.push(o);
              }),
              r
            );
          })(i, n)),
          (i.redirect = {
            300: !0,
            301: !0,
            302: !0,
            303: !0,
            305: !0,
            307: !0,
            308: !0,
          }),
          (i.empty = {
            204: !0,
            205: !0,
            304: !0,
          }),
          (i.retry = {
            502: !0,
            503: !0,
            504: !0,
          });
      },
      11379: (t, e) => {
        function r(t, e, r) {
          return e <= t && t <= r;
        }

        function n(t) {
          if (void 0 === t) return {};
          if (t === Object(t)) return t;
          throw TypeError("Could not convert argument to dictionary");
        }

        function i(t) {
          this.tokens = [].slice.call(t);
        }
        i.prototype = {
          endOfStream: function () {
            return !this.tokens.length;
          },
          read: function () {
            return this.tokens.length ? this.tokens.shift() : -1;
          },
          prepend: function (t) {
            if (Array.isArray(t)) for (var e = t; e.length; ) this.tokens.unshift(e.pop());
            else this.tokens.unshift(t);
          },
          push: function (t) {
            if (Array.isArray(t)) for (var e = t; e.length; ) this.tokens.push(e.shift());
            else this.tokens.push(t);
          },
        };
        var o = -1;

        function s(t, e) {
          if (t) throw TypeError("Decoder error");
          return e || 65533;
        }
        var a = "utf-8";

        function c(t, e) {
          if (!(this instanceof c)) return new c(t, e);
          if ((t = void 0 !== t ? String(t).toLowerCase() : a) !== a)
            throw new Error("Encoding not supported. Only utf-8 is supported");
          (e = n(e)),
            (this._streaming = !1),
            (this._BOMseen = !1),
            (this._decoder = null),
            (this._fatal = Boolean(e.fatal)),
            (this._ignoreBOM = Boolean(e.ignoreBOM)),
            Object.defineProperty(this, "encoding", {
              value: "utf-8",
            }),
            Object.defineProperty(this, "fatal", {
              value: this._fatal,
            }),
            Object.defineProperty(this, "ignoreBOM", {
              value: this._ignoreBOM,
            });
        }

        function u(t, e) {
          if (!(this instanceof u)) return new u(t, e);
          if ((t = void 0 !== t ? String(t).toLowerCase() : a) !== a)
            throw new Error("Encoding not supported. Only utf-8 is supported");
          (e = n(e)),
            (this._streaming = !1),
            (this._encoder = null),
            (this._options = {
              fatal: Boolean(e.fatal),
            }),
            Object.defineProperty(this, "encoding", {
              value: "utf-8",
            });
        }

        function h(t) {
          var e = t.fatal,
            n = 0,
            i = 0,
            a = 0,
            c = 128,
            u = 191;
          this.handler = function (t, h) {
            if (-1 === h && 0 !== a) return (a = 0), s(e);
            if (-1 === h) return o;
            if (0 === a) {
              if (r(h, 0, 127)) return h;
              if (r(h, 194, 223)) (a = 1), (n = h - 192);
              else if (r(h, 224, 239))
                224 === h && (c = 160), 237 === h && (u = 159), (a = 2), (n = h - 224);
              else {
                if (!r(h, 240, 244)) return s(e);
                240 === h && (c = 144), 244 === h && (u = 143), (a = 3), (n = h - 240);
              }
              return (n <<= 6 * a), null;
            }
            if (!r(h, c, u)) return (n = a = i = 0), (c = 128), (u = 191), t.prepend(h), s(e);
            if (((c = 128), (u = 191), (n += (h - 128) << (6 * (a - (i += 1)))), i !== a))
              return null;
            var l = n;
            return (n = a = i = 0), l;
          };
        }

        function l(t) {
          t.fatal;
          this.handler = function (t, e) {
            if (-1 === e) return o;
            if (r(e, 0, 127)) return e;
            var n, i;
            r(e, 128, 2047)
              ? ((n = 1), (i = 192))
              : r(e, 2048, 65535)
                ? ((n = 2), (i = 224))
                : r(e, 65536, 1114111) && ((n = 3), (i = 240));
            for (var s = [(e >> (6 * n)) + i]; n > 0; ) {
              var a = e >> (6 * (n - 1));
              s.push(128 | (63 & a)), (n -= 1);
            }
            return s;
          };
        }
        (c.prototype = {
          decode: function (t, e) {
            var r;
            (r =
              "object" == typeof t && t instanceof ArrayBuffer
                ? new Uint8Array(t)
                : "object" == typeof t && "buffer" in t && t.buffer instanceof ArrayBuffer
                  ? new Uint8Array(t.buffer, t.byteOffset, t.byteLength)
                  : new Uint8Array(0)),
              (e = n(e)),
              this._streaming ||
                ((this._decoder = new h({
                  fatal: this._fatal,
                })),
                (this._BOMseen = !1)),
              (this._streaming = Boolean(e.stream));
            for (
              var s, a = new i(r), c = [];
              !a.endOfStream() && (s = this._decoder.handler(a, a.read())) !== o;
            )
              null !== s && (Array.isArray(s) ? c.push.apply(c, s) : c.push(s));
            if (!this._streaming) {
              do {
                if ((s = this._decoder.handler(a, a.read())) === o) break;
                null !== s && (Array.isArray(s) ? c.push.apply(c, s) : c.push(s));
              } while (!a.endOfStream());
              this._decoder = null;
            }
            return (
              c.length &&
                (-1 === ["utf-8"].indexOf(this.encoding) ||
                  this._ignoreBOM ||
                  this._BOMseen ||
                  (65279 === c[0] ? ((this._BOMseen = !0), c.shift()) : (this._BOMseen = !0))),
              (function (t) {
                for (var e = "", r = 0; r < t.length; ++r) {
                  var n = t[r];
                  n <= 65535
                    ? (e += String.fromCharCode(n))
                    : ((n -= 65536),
                      (e += String.fromCharCode(55296 + (n >> 10), 56320 + (1023 & n))));
                }
                return e;
              })(c)
            );
          },
        }),
          (u.prototype = {
            encode: function (t, e) {
              (t = t ? String(t) : ""),
                (e = n(e)),
                this._streaming || (this._encoder = new l(this._options)),
                (this._streaming = Boolean(e.stream));
              for (
                var r,
                  s = [],
                  a = new i(
                    (function (t) {
                      for (var e = String(t), r = e.length, n = 0, i = []; n < r; ) {
                        var o = e.charCodeAt(n);
                        if (o < 55296 || o > 57343) i.push(o);
                        else if (56320 <= o && o <= 57343) i.push(65533);
                        else if (55296 <= o && o <= 56319)
                          if (n === r - 1) i.push(65533);
                          else {
                            var s = t.charCodeAt(n + 1);
                            if (56320 <= s && s <= 57343) {
                              var a = 1023 & o,
                                c = 1023 & s;
                              i.push(65536 + (a << 10) + c), (n += 1);
                            } else i.push(65533);
                          }
                        n += 1;
                      }
                      return i;
                    })(t),
                  );
                !a.endOfStream() && (r = this._encoder.handler(a, a.read())) !== o;
              )
                Array.isArray(r) ? s.push.apply(s, r) : s.push(r);
              if (!this._streaming) {
                while ((r = this._encoder.handler(a, a.read())) !== o)
                  Array.isArray(r) ? s.push.apply(s, r) : s.push(r);
                this._encoder = null;
              }
              return new Uint8Array(s);
            },
          }),
          (e.TextEncoder = u),
          (e.TextDecoder = c);
      },
      72953: (t) => {
        /*!
         * toidentifier
         * Copyright(c) 2016 Douglas Christopher Wilson
         * MIT Licensed
         */
        t.exports = function (t) {
          return t
            .split(" ")
            .map(function (t) {
              return t.slice(0, 1).toUpperCase() + t.slice(1);
            })
            .join("")
            .replace(/[^ _0-9a-z]/gi, "");
        };
      },
      50780: (t, e, r) => {
        !(function (t) {
          var e = function (t) {
              var e,
                r = new Float64Array(16);
              if (t) for (e = 0; e < t.length; e++) r[e] = t[e];
              return r;
            },
            n = function () {
              throw new Error("no PRNG");
            },
            i = new Uint8Array(16),
            o = new Uint8Array(32);
          o[0] = 9;
          var s = e(),
            a = e([1]),
            c = e([56129, 1]),
            u = e([
              30883, 4953, 19914, 30187, 55467, 16705, 2637, 112, 59544, 30585, 16505, 36039, 65139,
              11119, 27886, 20995,
            ]),
            h = e([
              61785, 9906, 39828, 60374, 45398, 33411, 5274, 224, 53552, 61171, 33010, 6542, 64743,
              22239, 55772, 9222,
            ]),
            l = e([
              54554, 36645, 11616, 51542, 42930, 38181, 51040, 26924, 56412, 64982, 57905, 49316,
              21502, 52590, 14035, 8553,
            ]),
            f = e([
              26200, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214,
              26214, 26214, 26214, 26214,
            ]),
            d = e([
              41136, 18958, 6951, 50414, 58488, 44335, 6150, 12099, 55207, 15867, 153, 11085, 57099,
              20417, 9344, 11139,
            ]);

          function p(t, e, r, n) {
            (t[e] = (r >> 24) & 255),
              (t[e + 1] = (r >> 16) & 255),
              (t[e + 2] = (r >> 8) & 255),
              (t[e + 3] = 255 & r),
              (t[e + 4] = (n >> 24) & 255),
              (t[e + 5] = (n >> 16) & 255),
              (t[e + 6] = (n >> 8) & 255),
              (t[e + 7] = 255 & n);
          }

          function y(t, e, r, n, i) {
            var o,
              s = 0;
            for (o = 0; o < i; o++) s |= t[e + o] ^ r[n + o];
            return (1 & ((s - 1) >>> 8)) - 1;
          }

          function m(t, e, r, n) {
            return y(t, e, r, n, 16);
          }

          function g(t, e, r, n) {
            return y(t, e, r, n, 32);
          }

          function w(t, e, r, n) {
            !(function (t, e, r, n) {
              for (
                var i,
                  o =
                    (255 & n[0]) |
                    ((255 & n[1]) << 8) |
                    ((255 & n[2]) << 16) |
                    ((255 & n[3]) << 24),
                  s =
                    (255 & r[0]) |
                    ((255 & r[1]) << 8) |
                    ((255 & r[2]) << 16) |
                    ((255 & r[3]) << 24),
                  a =
                    (255 & r[4]) |
                    ((255 & r[5]) << 8) |
                    ((255 & r[6]) << 16) |
                    ((255 & r[7]) << 24),
                  c =
                    (255 & r[8]) |
                    ((255 & r[9]) << 8) |
                    ((255 & r[10]) << 16) |
                    ((255 & r[11]) << 24),
                  u =
                    (255 & r[12]) |
                    ((255 & r[13]) << 8) |
                    ((255 & r[14]) << 16) |
                    ((255 & r[15]) << 24),
                  h =
                    (255 & n[4]) |
                    ((255 & n[5]) << 8) |
                    ((255 & n[6]) << 16) |
                    ((255 & n[7]) << 24),
                  l =
                    (255 & e[0]) |
                    ((255 & e[1]) << 8) |
                    ((255 & e[2]) << 16) |
                    ((255 & e[3]) << 24),
                  f =
                    (255 & e[4]) |
                    ((255 & e[5]) << 8) |
                    ((255 & e[6]) << 16) |
                    ((255 & e[7]) << 24),
                  d =
                    (255 & e[8]) |
                    ((255 & e[9]) << 8) |
                    ((255 & e[10]) << 16) |
                    ((255 & e[11]) << 24),
                  p =
                    (255 & e[12]) |
                    ((255 & e[13]) << 8) |
                    ((255 & e[14]) << 16) |
                    ((255 & e[15]) << 24),
                  y =
                    (255 & n[8]) |
                    ((255 & n[9]) << 8) |
                    ((255 & n[10]) << 16) |
                    ((255 & n[11]) << 24),
                  m =
                    (255 & r[16]) |
                    ((255 & r[17]) << 8) |
                    ((255 & r[18]) << 16) |
                    ((255 & r[19]) << 24),
                  g =
                    (255 & r[20]) |
                    ((255 & r[21]) << 8) |
                    ((255 & r[22]) << 16) |
                    ((255 & r[23]) << 24),
                  w =
                    (255 & r[24]) |
                    ((255 & r[25]) << 8) |
                    ((255 & r[26]) << 16) |
                    ((255 & r[27]) << 24),
                  v =
                    (255 & r[28]) |
                    ((255 & r[29]) << 8) |
                    ((255 & r[30]) << 16) |
                    ((255 & r[31]) << 24),
                  b =
                    (255 & n[12]) |
                    ((255 & n[13]) << 8) |
                    ((255 & n[14]) << 16) |
                    ((255 & n[15]) << 24),
                  _ = o,
                  E = s,
                  A = a,
                  M = c,
                  S = u,
                  I = h,
                  k = l,
                  x = f,
                  T = d,
                  O = p,
                  C = y,
                  R = m,
                  P = g,
                  N = w,
                  U = v,
                  B = b,
                  K = 0;
                K < 20;
                K += 2
              )
                (_ ^=
                  ((i =
                    ((P ^=
                      ((i =
                        ((T ^=
                          ((i = ((S ^= ((i = (_ + P) | 0) << 7) | (i >>> 25)) + _) | 0) << 9) |
                          (i >>> 23)) +
                          S) |
                        0) <<
                        13) |
                      (i >>> 19)) +
                      T) |
                    0) <<
                    18) |
                  (i >>> 14)),
                  (I ^=
                    ((i =
                      ((E ^=
                        ((i =
                          ((N ^=
                            ((i = ((O ^= ((i = (I + E) | 0) << 7) | (i >>> 25)) + I) | 0) << 9) |
                            (i >>> 23)) +
                            O) |
                          0) <<
                          13) |
                        (i >>> 19)) +
                        N) |
                      0) <<
                      18) |
                    (i >>> 14)),
                  (C ^=
                    ((i =
                      ((k ^=
                        ((i =
                          ((A ^=
                            ((i = ((U ^= ((i = (C + k) | 0) << 7) | (i >>> 25)) + C) | 0) << 9) |
                            (i >>> 23)) +
                            U) |
                          0) <<
                          13) |
                        (i >>> 19)) +
                        A) |
                      0) <<
                      18) |
                    (i >>> 14)),
                  (B ^=
                    ((i =
                      ((R ^=
                        ((i =
                          ((x ^=
                            ((i = ((M ^= ((i = (B + R) | 0) << 7) | (i >>> 25)) + B) | 0) << 9) |
                            (i >>> 23)) +
                            M) |
                          0) <<
                          13) |
                        (i >>> 19)) +
                        x) |
                      0) <<
                      18) |
                    (i >>> 14)),
                  (_ ^=
                    ((i =
                      ((M ^=
                        ((i =
                          ((A ^=
                            ((i = ((E ^= ((i = (_ + M) | 0) << 7) | (i >>> 25)) + _) | 0) << 9) |
                            (i >>> 23)) +
                            E) |
                          0) <<
                          13) |
                        (i >>> 19)) +
                        A) |
                      0) <<
                      18) |
                    (i >>> 14)),
                  (I ^=
                    ((i =
                      ((S ^=
                        ((i =
                          ((x ^=
                            ((i = ((k ^= ((i = (I + S) | 0) << 7) | (i >>> 25)) + I) | 0) << 9) |
                            (i >>> 23)) +
                            k) |
                          0) <<
                          13) |
                        (i >>> 19)) +
                        x) |
                      0) <<
                      18) |
                    (i >>> 14)),
                  (C ^=
                    ((i =
                      ((O ^=
                        ((i =
                          ((T ^=
                            ((i = ((R ^= ((i = (C + O) | 0) << 7) | (i >>> 25)) + C) | 0) << 9) |
                            (i >>> 23)) +
                            R) |
                          0) <<
                          13) |
                        (i >>> 19)) +
                        T) |
                      0) <<
                      18) |
                    (i >>> 14)),
                  (B ^=
                    ((i =
                      ((U ^=
                        ((i =
                          ((N ^=
                            ((i = ((P ^= ((i = (B + U) | 0) << 7) | (i >>> 25)) + B) | 0) << 9) |
                            (i >>> 23)) +
                            P) |
                          0) <<
                          13) |
                        (i >>> 19)) +
                        N) |
                      0) <<
                      18) |
                    (i >>> 14));
              (_ = (_ + o) | 0),
                (E = (E + s) | 0),
                (A = (A + a) | 0),
                (M = (M + c) | 0),
                (S = (S + u) | 0),
                (I = (I + h) | 0),
                (k = (k + l) | 0),
                (x = (x + f) | 0),
                (T = (T + d) | 0),
                (O = (O + p) | 0),
                (C = (C + y) | 0),
                (R = (R + m) | 0),
                (P = (P + g) | 0),
                (N = (N + w) | 0),
                (U = (U + v) | 0),
                (B = (B + b) | 0),
                (t[0] = (_ >>> 0) & 255),
                (t[1] = (_ >>> 8) & 255),
                (t[2] = (_ >>> 16) & 255),
                (t[3] = (_ >>> 24) & 255),
                (t[4] = (E >>> 0) & 255),
                (t[5] = (E >>> 8) & 255),
                (t[6] = (E >>> 16) & 255),
                (t[7] = (E >>> 24) & 255),
                (t[8] = (A >>> 0) & 255),
                (t[9] = (A >>> 8) & 255),
                (t[10] = (A >>> 16) & 255),
                (t[11] = (A >>> 24) & 255),
                (t[12] = (M >>> 0) & 255),
                (t[13] = (M >>> 8) & 255),
                (t[14] = (M >>> 16) & 255),
                (t[15] = (M >>> 24) & 255),
                (t[16] = (S >>> 0) & 255),
                (t[17] = (S >>> 8) & 255),
                (t[18] = (S >>> 16) & 255),
                (t[19] = (S >>> 24) & 255),
                (t[20] = (I >>> 0) & 255),
                (t[21] = (I >>> 8) & 255),
                (t[22] = (I >>> 16) & 255),
                (t[23] = (I >>> 24) & 255),
                (t[24] = (k >>> 0) & 255),
                (t[25] = (k >>> 8) & 255),
                (t[26] = (k >>> 16) & 255),
                (t[27] = (k >>> 24) & 255),
                (t[28] = (x >>> 0) & 255),
                (t[29] = (x >>> 8) & 255),
                (t[30] = (x >>> 16) & 255),
                (t[31] = (x >>> 24) & 255),
                (t[32] = (T >>> 0) & 255),
                (t[33] = (T >>> 8) & 255),
                (t[34] = (T >>> 16) & 255),
                (t[35] = (T >>> 24) & 255),
                (t[36] = (O >>> 0) & 255),
                (t[37] = (O >>> 8) & 255),
                (t[38] = (O >>> 16) & 255),
                (t[39] = (O >>> 24) & 255),
                (t[40] = (C >>> 0) & 255),
                (t[41] = (C >>> 8) & 255),
                (t[42] = (C >>> 16) & 255),
                (t[43] = (C >>> 24) & 255),
                (t[44] = (R >>> 0) & 255),
                (t[45] = (R >>> 8) & 255),
                (t[46] = (R >>> 16) & 255),
                (t[47] = (R >>> 24) & 255),
                (t[48] = (P >>> 0) & 255),
                (t[49] = (P >>> 8) & 255),
                (t[50] = (P >>> 16) & 255),
                (t[51] = (P >>> 24) & 255),
                (t[52] = (N >>> 0) & 255),
                (t[53] = (N >>> 8) & 255),
                (t[54] = (N >>> 16) & 255),
                (t[55] = (N >>> 24) & 255),
                (t[56] = (U >>> 0) & 255),
                (t[57] = (U >>> 8) & 255),
                (t[58] = (U >>> 16) & 255),
                (t[59] = (U >>> 24) & 255),
                (t[60] = (B >>> 0) & 255),
                (t[61] = (B >>> 8) & 255),
                (t[62] = (B >>> 16) & 255),
                (t[63] = (B >>> 24) & 255);
            })(t, e, r, n);
          }

          function v(t, e, r, n) {
            !(function (t, e, r, n) {
              for (
                var i,
                  o =
                    (255 & n[0]) |
                    ((255 & n[1]) << 8) |
                    ((255 & n[2]) << 16) |
                    ((255 & n[3]) << 24),
                  s =
                    (255 & r[0]) |
                    ((255 & r[1]) << 8) |
                    ((255 & r[2]) << 16) |
                    ((255 & r[3]) << 24),
                  a =
                    (255 & r[4]) |
                    ((255 & r[5]) << 8) |
                    ((255 & r[6]) << 16) |
                    ((255 & r[7]) << 24),
                  c =
                    (255 & r[8]) |
                    ((255 & r[9]) << 8) |
                    ((255 & r[10]) << 16) |
                    ((255 & r[11]) << 24),
                  u =
                    (255 & r[12]) |
                    ((255 & r[13]) << 8) |
                    ((255 & r[14]) << 16) |
                    ((255 & r[15]) << 24),
                  h =
                    (255 & n[4]) |
                    ((255 & n[5]) << 8) |
                    ((255 & n[6]) << 16) |
                    ((255 & n[7]) << 24),
                  l =
                    (255 & e[0]) |
                    ((255 & e[1]) << 8) |
                    ((255 & e[2]) << 16) |
                    ((255 & e[3]) << 24),
                  f =
                    (255 & e[4]) |
                    ((255 & e[5]) << 8) |
                    ((255 & e[6]) << 16) |
                    ((255 & e[7]) << 24),
                  d =
                    (255 & e[8]) |
                    ((255 & e[9]) << 8) |
                    ((255 & e[10]) << 16) |
                    ((255 & e[11]) << 24),
                  p =
                    (255 & e[12]) |
                    ((255 & e[13]) << 8) |
                    ((255 & e[14]) << 16) |
                    ((255 & e[15]) << 24),
                  y =
                    (255 & n[8]) |
                    ((255 & n[9]) << 8) |
                    ((255 & n[10]) << 16) |
                    ((255 & n[11]) << 24),
                  m =
                    (255 & r[16]) |
                    ((255 & r[17]) << 8) |
                    ((255 & r[18]) << 16) |
                    ((255 & r[19]) << 24),
                  g =
                    (255 & r[20]) |
                    ((255 & r[21]) << 8) |
                    ((255 & r[22]) << 16) |
                    ((255 & r[23]) << 24),
                  w =
                    (255 & r[24]) |
                    ((255 & r[25]) << 8) |
                    ((255 & r[26]) << 16) |
                    ((255 & r[27]) << 24),
                  v =
                    (255 & r[28]) |
                    ((255 & r[29]) << 8) |
                    ((255 & r[30]) << 16) |
                    ((255 & r[31]) << 24),
                  b =
                    (255 & n[12]) |
                    ((255 & n[13]) << 8) |
                    ((255 & n[14]) << 16) |
                    ((255 & n[15]) << 24),
                  _ = 0;
                _ < 20;
                _ += 2
              )
                (o ^=
                  ((i =
                    ((g ^=
                      ((i =
                        ((d ^=
                          ((i = ((u ^= ((i = (o + g) | 0) << 7) | (i >>> 25)) + o) | 0) << 9) |
                          (i >>> 23)) +
                          u) |
                        0) <<
                        13) |
                      (i >>> 19)) +
                      d) |
                    0) <<
                    18) |
                  (i >>> 14)),
                  (h ^=
                    ((i =
                      ((s ^=
                        ((i =
                          ((w ^=
                            ((i = ((p ^= ((i = (h + s) | 0) << 7) | (i >>> 25)) + h) | 0) << 9) |
                            (i >>> 23)) +
                            p) |
                          0) <<
                          13) |
                        (i >>> 19)) +
                        w) |
                      0) <<
                      18) |
                    (i >>> 14)),
                  (y ^=
                    ((i =
                      ((l ^=
                        ((i =
                          ((a ^=
                            ((i = ((v ^= ((i = (y + l) | 0) << 7) | (i >>> 25)) + y) | 0) << 9) |
                            (i >>> 23)) +
                            v) |
                          0) <<
                          13) |
                        (i >>> 19)) +
                        a) |
                      0) <<
                      18) |
                    (i >>> 14)),
                  (b ^=
                    ((i =
                      ((m ^=
                        ((i =
                          ((f ^=
                            ((i = ((c ^= ((i = (b + m) | 0) << 7) | (i >>> 25)) + b) | 0) << 9) |
                            (i >>> 23)) +
                            c) |
                          0) <<
                          13) |
                        (i >>> 19)) +
                        f) |
                      0) <<
                      18) |
                    (i >>> 14)),
                  (o ^=
                    ((i =
                      ((c ^=
                        ((i =
                          ((a ^=
                            ((i = ((s ^= ((i = (o + c) | 0) << 7) | (i >>> 25)) + o) | 0) << 9) |
                            (i >>> 23)) +
                            s) |
                          0) <<
                          13) |
                        (i >>> 19)) +
                        a) |
                      0) <<
                      18) |
                    (i >>> 14)),
                  (h ^=
                    ((i =
                      ((u ^=
                        ((i =
                          ((f ^=
                            ((i = ((l ^= ((i = (h + u) | 0) << 7) | (i >>> 25)) + h) | 0) << 9) |
                            (i >>> 23)) +
                            l) |
                          0) <<
                          13) |
                        (i >>> 19)) +
                        f) |
                      0) <<
                      18) |
                    (i >>> 14)),
                  (y ^=
                    ((i =
                      ((p ^=
                        ((i =
                          ((d ^=
                            ((i = ((m ^= ((i = (y + p) | 0) << 7) | (i >>> 25)) + y) | 0) << 9) |
                            (i >>> 23)) +
                            m) |
                          0) <<
                          13) |
                        (i >>> 19)) +
                        d) |
                      0) <<
                      18) |
                    (i >>> 14)),
                  (b ^=
                    ((i =
                      ((v ^=
                        ((i =
                          ((w ^=
                            ((i = ((g ^= ((i = (b + v) | 0) << 7) | (i >>> 25)) + b) | 0) << 9) |
                            (i >>> 23)) +
                            g) |
                          0) <<
                          13) |
                        (i >>> 19)) +
                        w) |
                      0) <<
                      18) |
                    (i >>> 14));
              (t[0] = (o >>> 0) & 255),
                (t[1] = (o >>> 8) & 255),
                (t[2] = (o >>> 16) & 255),
                (t[3] = (o >>> 24) & 255),
                (t[4] = (h >>> 0) & 255),
                (t[5] = (h >>> 8) & 255),
                (t[6] = (h >>> 16) & 255),
                (t[7] = (h >>> 24) & 255),
                (t[8] = (y >>> 0) & 255),
                (t[9] = (y >>> 8) & 255),
                (t[10] = (y >>> 16) & 255),
                (t[11] = (y >>> 24) & 255),
                (t[12] = (b >>> 0) & 255),
                (t[13] = (b >>> 8) & 255),
                (t[14] = (b >>> 16) & 255),
                (t[15] = (b >>> 24) & 255),
                (t[16] = (l >>> 0) & 255),
                (t[17] = (l >>> 8) & 255),
                (t[18] = (l >>> 16) & 255),
                (t[19] = (l >>> 24) & 255),
                (t[20] = (f >>> 0) & 255),
                (t[21] = (f >>> 8) & 255),
                (t[22] = (f >>> 16) & 255),
                (t[23] = (f >>> 24) & 255),
                (t[24] = (d >>> 0) & 255),
                (t[25] = (d >>> 8) & 255),
                (t[26] = (d >>> 16) & 255),
                (t[27] = (d >>> 24) & 255),
                (t[28] = (p >>> 0) & 255),
                (t[29] = (p >>> 8) & 255),
                (t[30] = (p >>> 16) & 255),
                (t[31] = (p >>> 24) & 255);
            })(t, e, r, n);
          }
          var b = new Uint8Array([
            101, 120, 112, 97, 110, 100, 32, 51, 50, 45, 98, 121, 116, 101, 32, 107,
          ]);

          function _(t, e, r, n, i, o, s) {
            var a,
              c,
              u = new Uint8Array(16),
              h = new Uint8Array(64);
            for (c = 0; c < 16; c++) u[c] = 0;
            for (c = 0; c < 8; c++) u[c] = o[c];
            while (i >= 64) {
              for (w(h, u, s, b), c = 0; c < 64; c++) t[e + c] = r[n + c] ^ h[c];
              for (a = 1, c = 8; c < 16; c++)
                (a = (a + (255 & u[c])) | 0), (u[c] = 255 & a), (a >>>= 8);
              (i -= 64), (e += 64), (n += 64);
            }
            if (i > 0) for (w(h, u, s, b), c = 0; c < i; c++) t[e + c] = r[n + c] ^ h[c];
            return 0;
          }

          function E(t, e, r, n, i) {
            var o,
              s,
              a = new Uint8Array(16),
              c = new Uint8Array(64);
            for (s = 0; s < 16; s++) a[s] = 0;
            for (s = 0; s < 8; s++) a[s] = n[s];
            while (r >= 64) {
              for (w(c, a, i, b), s = 0; s < 64; s++) t[e + s] = c[s];
              for (o = 1, s = 8; s < 16; s++)
                (o = (o + (255 & a[s])) | 0), (a[s] = 255 & o), (o >>>= 8);
              (r -= 64), (e += 64);
            }
            if (r > 0) for (w(c, a, i, b), s = 0; s < r; s++) t[e + s] = c[s];
            return 0;
          }

          function A(t, e, r, n, i) {
            var o = new Uint8Array(32);
            v(o, n, i, b);
            for (var s = new Uint8Array(8), a = 0; a < 8; a++) s[a] = n[a + 16];
            return E(t, e, r, s, o);
          }

          function M(t, e, r, n, i, o, s) {
            var a = new Uint8Array(32);
            v(a, o, s, b);
            for (var c = new Uint8Array(8), u = 0; u < 8; u++) c[u] = o[u + 16];
            return _(t, e, r, n, i, c, a);
          }
          var S = function (t) {
            var e, r, n, i, o, s, a, c;
            (this.buffer = new Uint8Array(16)),
              (this.r = new Uint16Array(10)),
              (this.h = new Uint16Array(10)),
              (this.pad = new Uint16Array(8)),
              (this.leftover = 0),
              (this.fin = 0),
              (e = (255 & t[0]) | ((255 & t[1]) << 8)),
              (this.r[0] = 8191 & e),
              (r = (255 & t[2]) | ((255 & t[3]) << 8)),
              (this.r[1] = 8191 & ((e >>> 13) | (r << 3))),
              (n = (255 & t[4]) | ((255 & t[5]) << 8)),
              (this.r[2] = 7939 & ((r >>> 10) | (n << 6))),
              (i = (255 & t[6]) | ((255 & t[7]) << 8)),
              (this.r[3] = 8191 & ((n >>> 7) | (i << 9))),
              (o = (255 & t[8]) | ((255 & t[9]) << 8)),
              (this.r[4] = 255 & ((i >>> 4) | (o << 12))),
              (this.r[5] = (o >>> 1) & 8190),
              (s = (255 & t[10]) | ((255 & t[11]) << 8)),
              (this.r[6] = 8191 & ((o >>> 14) | (s << 2))),
              (a = (255 & t[12]) | ((255 & t[13]) << 8)),
              (this.r[7] = 8065 & ((s >>> 11) | (a << 5))),
              (c = (255 & t[14]) | ((255 & t[15]) << 8)),
              (this.r[8] = 8191 & ((a >>> 8) | (c << 8))),
              (this.r[9] = (c >>> 5) & 127),
              (this.pad[0] = (255 & t[16]) | ((255 & t[17]) << 8)),
              (this.pad[1] = (255 & t[18]) | ((255 & t[19]) << 8)),
              (this.pad[2] = (255 & t[20]) | ((255 & t[21]) << 8)),
              (this.pad[3] = (255 & t[22]) | ((255 & t[23]) << 8)),
              (this.pad[4] = (255 & t[24]) | ((255 & t[25]) << 8)),
              (this.pad[5] = (255 & t[26]) | ((255 & t[27]) << 8)),
              (this.pad[6] = (255 & t[28]) | ((255 & t[29]) << 8)),
              (this.pad[7] = (255 & t[30]) | ((255 & t[31]) << 8));
          };

          function I(t, e, r, n, i, o) {
            var s = new S(o);
            return s.update(r, n, i), s.finish(t, e), 0;
          }

          function k(t, e, r, n, i, o) {
            var s = new Uint8Array(16);
            return I(s, 0, r, n, i, o), m(t, e, s, 0);
          }

          function x(t, e, r, n, i) {
            var o;
            if (r < 32) return -1;
            for (M(t, 0, e, 0, r, n, i), I(t, 16, t, 32, r - 32, t), o = 0; o < 16; o++) t[o] = 0;
            return 0;
          }

          function T(t, e, r, n, i) {
            var o,
              s = new Uint8Array(32);
            if (r < 32) return -1;
            if ((A(s, 0, 32, n, i), 0 !== k(e, 16, e, 32, r - 32, s))) return -1;
            for (M(t, 0, e, 0, r, n, i), o = 0; o < 32; o++) t[o] = 0;
            return 0;
          }

          function O(t, e) {
            var r;
            for (r = 0; r < 16; r++) t[r] = 0 | e[r];
          }

          function C(t) {
            var e,
              r,
              n = 1;
            for (e = 0; e < 16; e++)
              (r = t[e] + n + 65535), (n = Math.floor(r / 65536)), (t[e] = r - 65536 * n);
            t[0] += n - 1 + 37 * (n - 1);
          }

          function R(t, e, r) {
            for (var n, i = ~(r - 1), o = 0; o < 16; o++)
              (n = i & (t[o] ^ e[o])), (t[o] ^= n), (e[o] ^= n);
          }

          function P(t, r) {
            var n,
              i,
              o,
              s = e(),
              a = e();
            for (n = 0; n < 16; n++) a[n] = r[n];
            for (C(a), C(a), C(a), i = 0; i < 2; i++) {
              for (s[0] = a[0] - 65517, n = 1; n < 15; n++)
                (s[n] = a[n] - 65535 - ((s[n - 1] >> 16) & 1)), (s[n - 1] &= 65535);
              (s[15] = a[15] - 32767 - ((s[14] >> 16) & 1)),
                (o = (s[15] >> 16) & 1),
                (s[14] &= 65535),
                R(a, s, 1 - o);
            }
            for (n = 0; n < 16; n++) (t[2 * n] = 255 & a[n]), (t[2 * n + 1] = a[n] >> 8);
          }

          function N(t, e) {
            var r = new Uint8Array(32),
              n = new Uint8Array(32);
            return P(r, t), P(n, e), g(r, 0, n, 0);
          }

          function U(t) {
            var e = new Uint8Array(32);
            return P(e, t), 1 & e[0];
          }

          function B(t, e) {
            var r;
            for (r = 0; r < 16; r++) t[r] = e[2 * r] + (e[2 * r + 1] << 8);
            t[15] &= 32767;
          }

          function K(t, e, r) {
            for (var n = 0; n < 16; n++) t[n] = e[n] + r[n];
          }

          function L(t, e, r) {
            for (var n = 0; n < 16; n++) t[n] = e[n] - r[n];
          }

          function j(t, e, r) {
            var n,
              i,
              o = 0,
              s = 0,
              a = 0,
              c = 0,
              u = 0,
              h = 0,
              l = 0,
              f = 0,
              d = 0,
              p = 0,
              y = 0,
              m = 0,
              g = 0,
              w = 0,
              v = 0,
              b = 0,
              _ = 0,
              E = 0,
              A = 0,
              M = 0,
              S = 0,
              I = 0,
              k = 0,
              x = 0,
              T = 0,
              O = 0,
              C = 0,
              R = 0,
              P = 0,
              N = 0,
              U = 0,
              B = r[0],
              K = r[1],
              L = r[2],
              j = r[3],
              F = r[4],
              D = r[5],
              H = r[6],
              q = r[7],
              $ = r[8],
              z = r[9],
              G = r[10],
              X = r[11],
              W = r[12],
              J = r[13],
              V = r[14],
              Y = r[15];
            (o += (n = e[0]) * B),
              (s += n * K),
              (a += n * L),
              (c += n * j),
              (u += n * F),
              (h += n * D),
              (l += n * H),
              (f += n * q),
              (d += n * $),
              (p += n * z),
              (y += n * G),
              (m += n * X),
              (g += n * W),
              (w += n * J),
              (v += n * V),
              (b += n * Y),
              (s += (n = e[1]) * B),
              (a += n * K),
              (c += n * L),
              (u += n * j),
              (h += n * F),
              (l += n * D),
              (f += n * H),
              (d += n * q),
              (p += n * $),
              (y += n * z),
              (m += n * G),
              (g += n * X),
              (w += n * W),
              (v += n * J),
              (b += n * V),
              (_ += n * Y),
              (a += (n = e[2]) * B),
              (c += n * K),
              (u += n * L),
              (h += n * j),
              (l += n * F),
              (f += n * D),
              (d += n * H),
              (p += n * q),
              (y += n * $),
              (m += n * z),
              (g += n * G),
              (w += n * X),
              (v += n * W),
              (b += n * J),
              (_ += n * V),
              (E += n * Y),
              (c += (n = e[3]) * B),
              (u += n * K),
              (h += n * L),
              (l += n * j),
              (f += n * F),
              (d += n * D),
              (p += n * H),
              (y += n * q),
              (m += n * $),
              (g += n * z),
              (w += n * G),
              (v += n * X),
              (b += n * W),
              (_ += n * J),
              (E += n * V),
              (A += n * Y),
              (u += (n = e[4]) * B),
              (h += n * K),
              (l += n * L),
              (f += n * j),
              (d += n * F),
              (p += n * D),
              (y += n * H),
              (m += n * q),
              (g += n * $),
              (w += n * z),
              (v += n * G),
              (b += n * X),
              (_ += n * W),
              (E += n * J),
              (A += n * V),
              (M += n * Y),
              (h += (n = e[5]) * B),
              (l += n * K),
              (f += n * L),
              (d += n * j),
              (p += n * F),
              (y += n * D),
              (m += n * H),
              (g += n * q),
              (w += n * $),
              (v += n * z),
              (b += n * G),
              (_ += n * X),
              (E += n * W),
              (A += n * J),
              (M += n * V),
              (S += n * Y),
              (l += (n = e[6]) * B),
              (f += n * K),
              (d += n * L),
              (p += n * j),
              (y += n * F),
              (m += n * D),
              (g += n * H),
              (w += n * q),
              (v += n * $),
              (b += n * z),
              (_ += n * G),
              (E += n * X),
              (A += n * W),
              (M += n * J),
              (S += n * V),
              (I += n * Y),
              (f += (n = e[7]) * B),
              (d += n * K),
              (p += n * L),
              (y += n * j),
              (m += n * F),
              (g += n * D),
              (w += n * H),
              (v += n * q),
              (b += n * $),
              (_ += n * z),
              (E += n * G),
              (A += n * X),
              (M += n * W),
              (S += n * J),
              (I += n * V),
              (k += n * Y),
              (d += (n = e[8]) * B),
              (p += n * K),
              (y += n * L),
              (m += n * j),
              (g += n * F),
              (w += n * D),
              (v += n * H),
              (b += n * q),
              (_ += n * $),
              (E += n * z),
              (A += n * G),
              (M += n * X),
              (S += n * W),
              (I += n * J),
              (k += n * V),
              (x += n * Y),
              (p += (n = e[9]) * B),
              (y += n * K),
              (m += n * L),
              (g += n * j),
              (w += n * F),
              (v += n * D),
              (b += n * H),
              (_ += n * q),
              (E += n * $),
              (A += n * z),
              (M += n * G),
              (S += n * X),
              (I += n * W),
              (k += n * J),
              (x += n * V),
              (T += n * Y),
              (y += (n = e[10]) * B),
              (m += n * K),
              (g += n * L),
              (w += n * j),
              (v += n * F),
              (b += n * D),
              (_ += n * H),
              (E += n * q),
              (A += n * $),
              (M += n * z),
              (S += n * G),
              (I += n * X),
              (k += n * W),
              (x += n * J),
              (T += n * V),
              (O += n * Y),
              (m += (n = e[11]) * B),
              (g += n * K),
              (w += n * L),
              (v += n * j),
              (b += n * F),
              (_ += n * D),
              (E += n * H),
              (A += n * q),
              (M += n * $),
              (S += n * z),
              (I += n * G),
              (k += n * X),
              (x += n * W),
              (T += n * J),
              (O += n * V),
              (C += n * Y),
              (g += (n = e[12]) * B),
              (w += n * K),
              (v += n * L),
              (b += n * j),
              (_ += n * F),
              (E += n * D),
              (A += n * H),
              (M += n * q),
              (S += n * $),
              (I += n * z),
              (k += n * G),
              (x += n * X),
              (T += n * W),
              (O += n * J),
              (C += n * V),
              (R += n * Y),
              (w += (n = e[13]) * B),
              (v += n * K),
              (b += n * L),
              (_ += n * j),
              (E += n * F),
              (A += n * D),
              (M += n * H),
              (S += n * q),
              (I += n * $),
              (k += n * z),
              (x += n * G),
              (T += n * X),
              (O += n * W),
              (C += n * J),
              (R += n * V),
              (P += n * Y),
              (v += (n = e[14]) * B),
              (b += n * K),
              (_ += n * L),
              (E += n * j),
              (A += n * F),
              (M += n * D),
              (S += n * H),
              (I += n * q),
              (k += n * $),
              (x += n * z),
              (T += n * G),
              (O += n * X),
              (C += n * W),
              (R += n * J),
              (P += n * V),
              (N += n * Y),
              (b += (n = e[15]) * B),
              (s += 38 * (E += n * L)),
              (a += 38 * (A += n * j)),
              (c += 38 * (M += n * F)),
              (u += 38 * (S += n * D)),
              (h += 38 * (I += n * H)),
              (l += 38 * (k += n * q)),
              (f += 38 * (x += n * $)),
              (d += 38 * (T += n * z)),
              (p += 38 * (O += n * G)),
              (y += 38 * (C += n * X)),
              (m += 38 * (R += n * W)),
              (g += 38 * (P += n * J)),
              (w += 38 * (N += n * V)),
              (v += 38 * (U += n * Y)),
              (o =
                (n = (o += 38 * (_ += n * K)) + (i = 1) + 65535) -
                65536 * (i = Math.floor(n / 65536))),
              (s = (n = s + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (a = (n = a + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (c = (n = c + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (u = (n = u + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (h = (n = h + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (l = (n = l + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (f = (n = f + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (d = (n = d + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (p = (n = p + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (y = (n = y + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (m = (n = m + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (g = (n = g + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (w = (n = w + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (v = (n = v + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (b = (n = b + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (o =
                (n = (o += i - 1 + 37 * (i - 1)) + (i = 1) + 65535) -
                65536 * (i = Math.floor(n / 65536))),
              (s = (n = s + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (a = (n = a + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (c = (n = c + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (u = (n = u + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (h = (n = h + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (l = (n = l + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (f = (n = f + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (d = (n = d + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (p = (n = p + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (y = (n = y + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (m = (n = m + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (g = (n = g + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (w = (n = w + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (v = (n = v + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (b = (n = b + i + 65535) - 65536 * (i = Math.floor(n / 65536))),
              (o += i - 1 + 37 * (i - 1)),
              (t[0] = o),
              (t[1] = s),
              (t[2] = a),
              (t[3] = c),
              (t[4] = u),
              (t[5] = h),
              (t[6] = l),
              (t[7] = f),
              (t[8] = d),
              (t[9] = p),
              (t[10] = y),
              (t[11] = m),
              (t[12] = g),
              (t[13] = w),
              (t[14] = v),
              (t[15] = b);
          }

          function F(t, e) {
            j(t, e, e);
          }

          function D(t, r) {
            var n,
              i = e();
            for (n = 0; n < 16; n++) i[n] = r[n];
            for (n = 253; n >= 0; n--) F(i, i), 2 !== n && 4 !== n && j(i, i, r);
            for (n = 0; n < 16; n++) t[n] = i[n];
          }

          function H(t, r) {
            var n,
              i = e();
            for (n = 0; n < 16; n++) i[n] = r[n];
            for (n = 250; n >= 0; n--) F(i, i), 1 !== n && j(i, i, r);
            for (n = 0; n < 16; n++) t[n] = i[n];
          }

          function q(t, r, n) {
            var i,
              o,
              s = new Uint8Array(32),
              a = new Float64Array(80),
              u = e(),
              h = e(),
              l = e(),
              f = e(),
              d = e(),
              p = e();
            for (o = 0; o < 31; o++) s[o] = r[o];
            for (s[31] = (127 & r[31]) | 64, s[0] &= 248, B(a, n), o = 0; o < 16; o++)
              (h[o] = a[o]), (f[o] = u[o] = l[o] = 0);
            for (u[0] = f[0] = 1, o = 254; o >= 0; --o)
              R(u, h, (i = (s[o >>> 3] >>> (7 & o)) & 1)),
                R(l, f, i),
                K(d, u, l),
                L(u, u, l),
                K(l, h, f),
                L(h, h, f),
                F(f, d),
                F(p, u),
                j(u, l, u),
                j(l, h, d),
                K(d, u, l),
                L(u, u, l),
                F(h, u),
                L(l, f, p),
                j(u, l, c),
                K(u, u, f),
                j(l, l, u),
                j(u, f, p),
                j(f, h, a),
                F(h, d),
                R(u, h, i),
                R(l, f, i);
            for (o = 0; o < 16; o++)
              (a[o + 16] = u[o]), (a[o + 32] = l[o]), (a[o + 48] = h[o]), (a[o + 64] = f[o]);
            var y = a.subarray(32),
              m = a.subarray(16);
            return D(y, y), j(m, m, y), P(t, m), 0;
          }

          function $(t, e) {
            return q(t, e, o);
          }

          function z(t, e) {
            return n(e, 32), $(t, e);
          }

          function G(t, e, r) {
            var n = new Uint8Array(32);
            return q(n, r, e), v(t, i, n, b);
          }
          (S.prototype.blocks = function (t, e, r) {
            for (
              var n,
                i,
                o,
                s,
                a,
                c,
                u,
                h,
                l,
                f,
                d,
                p,
                y,
                m,
                g,
                w,
                v,
                b,
                _,
                E = this.fin ? 0 : 2048,
                A = this.h[0],
                M = this.h[1],
                S = this.h[2],
                I = this.h[3],
                k = this.h[4],
                x = this.h[5],
                T = this.h[6],
                O = this.h[7],
                C = this.h[8],
                R = this.h[9],
                P = this.r[0],
                N = this.r[1],
                U = this.r[2],
                B = this.r[3],
                K = this.r[4],
                L = this.r[5],
                j = this.r[6],
                F = this.r[7],
                D = this.r[8],
                H = this.r[9];
              r >= 16;
            )
              (f = l = 0),
                (f += (A += 8191 & (n = (255 & t[e + 0]) | ((255 & t[e + 1]) << 8))) * P),
                (f +=
                  (M +=
                    8191 & ((n >>> 13) | ((i = (255 & t[e + 2]) | ((255 & t[e + 3]) << 8)) << 3))) *
                  (5 * H)),
                (f +=
                  (S +=
                    8191 & ((i >>> 10) | ((o = (255 & t[e + 4]) | ((255 & t[e + 5]) << 8)) << 6))) *
                  (5 * D)),
                (f +=
                  (I +=
                    8191 & ((o >>> 7) | ((s = (255 & t[e + 6]) | ((255 & t[e + 7]) << 8)) << 9))) *
                  (5 * F)),
                (l =
                  (f +=
                    (k +=
                      8191 &
                      ((s >>> 4) | ((a = (255 & t[e + 8]) | ((255 & t[e + 9]) << 8)) << 12))) *
                    (5 * j)) >>> 13),
                (f &= 8191),
                (f += (x += (a >>> 1) & 8191) * (5 * L)),
                (f +=
                  (T +=
                    8191 &
                    ((a >>> 14) | ((c = (255 & t[e + 10]) | ((255 & t[e + 11]) << 8)) << 2))) *
                  (5 * K)),
                (f +=
                  (O +=
                    8191 &
                    ((c >>> 11) | ((u = (255 & t[e + 12]) | ((255 & t[e + 13]) << 8)) << 5))) *
                  (5 * B)),
                (f +=
                  (C +=
                    8191 &
                    ((u >>> 8) | ((h = (255 & t[e + 14]) | ((255 & t[e + 15]) << 8)) << 8))) *
                  (5 * U)),
                (d = l += (f += (R += (h >>> 5) | E) * (5 * N)) >>> 13),
                (d += A * N),
                (d += M * P),
                (d += S * (5 * H)),
                (d += I * (5 * D)),
                (l = (d += k * (5 * F)) >>> 13),
                (d &= 8191),
                (d += x * (5 * j)),
                (d += T * (5 * L)),
                (d += O * (5 * K)),
                (d += C * (5 * B)),
                (l += (d += R * (5 * U)) >>> 13),
                (d &= 8191),
                (p = l),
                (p += A * U),
                (p += M * N),
                (p += S * P),
                (p += I * (5 * H)),
                (l = (p += k * (5 * D)) >>> 13),
                (p &= 8191),
                (p += x * (5 * F)),
                (p += T * (5 * j)),
                (p += O * (5 * L)),
                (p += C * (5 * K)),
                (y = l += (p += R * (5 * B)) >>> 13),
                (y += A * B),
                (y += M * U),
                (y += S * N),
                (y += I * P),
                (l = (y += k * (5 * H)) >>> 13),
                (y &= 8191),
                (y += x * (5 * D)),
                (y += T * (5 * F)),
                (y += O * (5 * j)),
                (y += C * (5 * L)),
                (m = l += (y += R * (5 * K)) >>> 13),
                (m += A * K),
                (m += M * B),
                (m += S * U),
                (m += I * N),
                (l = (m += k * P) >>> 13),
                (m &= 8191),
                (m += x * (5 * H)),
                (m += T * (5 * D)),
                (m += O * (5 * F)),
                (m += C * (5 * j)),
                (g = l += (m += R * (5 * L)) >>> 13),
                (g += A * L),
                (g += M * K),
                (g += S * B),
                (g += I * U),
                (l = (g += k * N) >>> 13),
                (g &= 8191),
                (g += x * P),
                (g += T * (5 * H)),
                (g += O * (5 * D)),
                (g += C * (5 * F)),
                (w = l += (g += R * (5 * j)) >>> 13),
                (w += A * j),
                (w += M * L),
                (w += S * K),
                (w += I * B),
                (l = (w += k * U) >>> 13),
                (w &= 8191),
                (w += x * N),
                (w += T * P),
                (w += O * (5 * H)),
                (w += C * (5 * D)),
                (v = l += (w += R * (5 * F)) >>> 13),
                (v += A * F),
                (v += M * j),
                (v += S * L),
                (v += I * K),
                (l = (v += k * B) >>> 13),
                (v &= 8191),
                (v += x * U),
                (v += T * N),
                (v += O * P),
                (v += C * (5 * H)),
                (b = l += (v += R * (5 * D)) >>> 13),
                (b += A * D),
                (b += M * F),
                (b += S * j),
                (b += I * L),
                (l = (b += k * K) >>> 13),
                (b &= 8191),
                (b += x * B),
                (b += T * U),
                (b += O * N),
                (b += C * P),
                (_ = l += (b += R * (5 * H)) >>> 13),
                (_ += A * H),
                (_ += M * D),
                (_ += S * F),
                (_ += I * j),
                (l = (_ += k * L) >>> 13),
                (_ &= 8191),
                (_ += x * K),
                (_ += T * B),
                (_ += O * U),
                (_ += C * N),
                (A = f =
                  8191 &
                  (l = ((l = (((l += (_ += R * P) >>> 13) << 2) + l) | 0) + (f &= 8191)) | 0)),
                (M = d += l >>>= 13),
                (S = p &= 8191),
                (I = y &= 8191),
                (k = m &= 8191),
                (x = g &= 8191),
                (T = w &= 8191),
                (O = v &= 8191),
                (C = b &= 8191),
                (R = _ &= 8191),
                (e += 16),
                (r -= 16);
            (this.h[0] = A),
              (this.h[1] = M),
              (this.h[2] = S),
              (this.h[3] = I),
              (this.h[4] = k),
              (this.h[5] = x),
              (this.h[6] = T),
              (this.h[7] = O),
              (this.h[8] = C),
              (this.h[9] = R);
          }),
            (S.prototype.finish = function (t, e) {
              var r,
                n,
                i,
                o,
                s = new Uint16Array(10);
              if (this.leftover) {
                for (o = this.leftover, this.buffer[o++] = 1; o < 16; o++) this.buffer[o] = 0;
                (this.fin = 1), this.blocks(this.buffer, 0, 16);
              }
              for (r = this.h[1] >>> 13, this.h[1] &= 8191, o = 2; o < 10; o++)
                (this.h[o] += r), (r = this.h[o] >>> 13), (this.h[o] &= 8191);
              for (
                this.h[0] += 5 * r,
                  r = this.h[0] >>> 13,
                  this.h[0] &= 8191,
                  this.h[1] += r,
                  r = this.h[1] >>> 13,
                  this.h[1] &= 8191,
                  this.h[2] += r,
                  s[0] = this.h[0] + 5,
                  r = s[0] >>> 13,
                  s[0] &= 8191,
                  o = 1;
                o < 10;
                o++
              )
                (s[o] = this.h[o] + r), (r = s[o] >>> 13), (s[o] &= 8191);
              for (s[9] -= 8192, n = (1 ^ r) - 1, o = 0; o < 10; o++) s[o] &= n;
              for (n = ~n, o = 0; o < 10; o++) this.h[o] = (this.h[o] & n) | s[o];
              for (
                this.h[0] = 65535 & (this.h[0] | (this.h[1] << 13)),
                  this.h[1] = 65535 & ((this.h[1] >>> 3) | (this.h[2] << 10)),
                  this.h[2] = 65535 & ((this.h[2] >>> 6) | (this.h[3] << 7)),
                  this.h[3] = 65535 & ((this.h[3] >>> 9) | (this.h[4] << 4)),
                  this.h[4] = 65535 & ((this.h[4] >>> 12) | (this.h[5] << 1) | (this.h[6] << 14)),
                  this.h[5] = 65535 & ((this.h[6] >>> 2) | (this.h[7] << 11)),
                  this.h[6] = 65535 & ((this.h[7] >>> 5) | (this.h[8] << 8)),
                  this.h[7] = 65535 & ((this.h[8] >>> 8) | (this.h[9] << 5)),
                  i = this.h[0] + this.pad[0],
                  this.h[0] = 65535 & i,
                  o = 1;
                o < 8;
                o++
              )
                (i = (((this.h[o] + this.pad[o]) | 0) + (i >>> 16)) | 0), (this.h[o] = 65535 & i);
              (t[e + 0] = (this.h[0] >>> 0) & 255),
                (t[e + 1] = (this.h[0] >>> 8) & 255),
                (t[e + 2] = (this.h[1] >>> 0) & 255),
                (t[e + 3] = (this.h[1] >>> 8) & 255),
                (t[e + 4] = (this.h[2] >>> 0) & 255),
                (t[e + 5] = (this.h[2] >>> 8) & 255),
                (t[e + 6] = (this.h[3] >>> 0) & 255),
                (t[e + 7] = (this.h[3] >>> 8) & 255),
                (t[e + 8] = (this.h[4] >>> 0) & 255),
                (t[e + 9] = (this.h[4] >>> 8) & 255),
                (t[e + 10] = (this.h[5] >>> 0) & 255),
                (t[e + 11] = (this.h[5] >>> 8) & 255),
                (t[e + 12] = (this.h[6] >>> 0) & 255),
                (t[e + 13] = (this.h[6] >>> 8) & 255),
                (t[e + 14] = (this.h[7] >>> 0) & 255),
                (t[e + 15] = (this.h[7] >>> 8) & 255);
            }),
            (S.prototype.update = function (t, e, r) {
              var n, i;
              if (this.leftover) {
                for ((i = 16 - this.leftover) > r && (i = r), n = 0; n < i; n++)
                  this.buffer[this.leftover + n] = t[e + n];
                if (((r -= i), (e += i), (this.leftover += i), this.leftover < 16)) return;
                this.blocks(this.buffer, 0, 16), (this.leftover = 0);
              }
              if ((r >= 16 && ((i = r - (r % 16)), this.blocks(t, e, i), (e += i), (r -= i)), r)) {
                for (n = 0; n < r; n++) this.buffer[this.leftover + n] = t[e + n];
                this.leftover += r;
              }
            });
          var X = x,
            W = T;
          var J = [
            1116352408, 3609767458, 1899447441, 602891725, 3049323471, 3964484399, 3921009573,
            2173295548, 961987163, 4081628472, 1508970993, 3053834265, 2453635748, 2937671579,
            2870763221, 3664609560, 3624381080, 2734883394, 310598401, 1164996542, 607225278,
            1323610764, 1426881987, 3590304994, 1925078388, 4068182383, 2162078206, 991336113,
            2614888103, 633803317, 3248222580, 3479774868, 3835390401, 2666613458, 4022224774,
            944711139, 264347078, 2341262773, 604807628, 2007800933, 770255983, 1495990901,
            1249150122, 1856431235, 1555081692, 3175218132, 1996064986, 2198950837, 2554220882,
            3999719339, 2821834349, 766784016, 2952996808, 2566594879, 3210313671, 3203337956,
            3336571891, 1034457026, 3584528711, 2466948901, 113926993, 3758326383, 338241895,
            168717936, 666307205, 1188179964, 773529912, 1546045734, 1294757372, 1522805485,
            1396182291, 2643833823, 1695183700, 2343527390, 1986661051, 1014477480, 2177026350,
            1206759142, 2456956037, 344077627, 2730485921, 1290863460, 2820302411, 3158454273,
            3259730800, 3505952657, 3345764771, 106217008, 3516065817, 3606008344, 3600352804,
            1432725776, 4094571909, 1467031594, 275423344, 851169720, 430227734, 3100823752,
            506948616, 1363258195, 659060556, 3750685593, 883997877, 3785050280, 958139571,
            3318307427, 1322822218, 3812723403, 1537002063, 2003034995, 1747873779, 3602036899,
            1955562222, 1575990012, 2024104815, 1125592928, 2227730452, 2716904306, 2361852424,
            442776044, 2428436474, 593698344, 2756734187, 3733110249, 3204031479, 2999351573,
            3329325298, 3815920427, 3391569614, 3928383900, 3515267271, 566280711, 3940187606,
            3454069534, 4118630271, 4000239992, 116418474, 1914138554, 174292421, 2731055270,
            289380356, 3203993006, 460393269, 320620315, 685471733, 587496836, 852142971,
            1086792851, 1017036298, 365543100, 1126000580, 2618297676, 1288033470, 3409855158,
            1501505948, 4234509866, 1607167915, 987167468, 1816402316, 1246189591,
          ];

          function V(t, e, r, n) {
            for (
              var i,
                o,
                s,
                a,
                c,
                u,
                h,
                l,
                f,
                d,
                p,
                y,
                m,
                g,
                w,
                v,
                b,
                _,
                E,
                A,
                M,
                S,
                I,
                k,
                x,
                T,
                O = new Int32Array(16),
                C = new Int32Array(16),
                R = t[0],
                P = t[1],
                N = t[2],
                U = t[3],
                B = t[4],
                K = t[5],
                L = t[6],
                j = t[7],
                F = e[0],
                D = e[1],
                H = e[2],
                q = e[3],
                $ = e[4],
                z = e[5],
                G = e[6],
                X = e[7],
                W = 0;
              n >= 128;
            ) {
              for (E = 0; E < 16; E++)
                (A = 8 * E + W),
                  (O[E] = (r[A + 0] << 24) | (r[A + 1] << 16) | (r[A + 2] << 8) | r[A + 3]),
                  (C[E] = (r[A + 4] << 24) | (r[A + 5] << 16) | (r[A + 6] << 8) | r[A + 7]);
              for (E = 0; E < 80; E++)
                if (
                  ((i = R),
                  (o = P),
                  (s = N),
                  (a = U),
                  (c = B),
                  (u = K),
                  (h = L),
                  j,
                  (f = F),
                  (d = D),
                  (p = H),
                  (y = q),
                  (m = $),
                  (g = z),
                  (w = G),
                  X,
                  (I = 65535 & (S = X)),
                  (k = S >>> 16),
                  (x = 65535 & (M = j)),
                  (T = M >>> 16),
                  (I +=
                    65535 &
                    (S =
                      (($ >>> 14) | (B << 18)) ^
                      (($ >>> 18) | (B << 14)) ^
                      ((B >>> 9) | ($ << 23)))),
                  (k += S >>> 16),
                  (x +=
                    65535 &
                    (M =
                      ((B >>> 14) | ($ << 18)) ^
                      ((B >>> 18) | ($ << 14)) ^
                      (($ >>> 9) | (B << 23)))),
                  (T += M >>> 16),
                  (I += 65535 & (S = ($ & z) ^ (~$ & G))),
                  (k += S >>> 16),
                  (x += 65535 & (M = (B & K) ^ (~B & L))),
                  (T += M >>> 16),
                  (I += 65535 & (S = J[2 * E + 1])),
                  (k += S >>> 16),
                  (x += 65535 & (M = J[2 * E])),
                  (T += M >>> 16),
                  (M = O[E % 16]),
                  (k += (S = C[E % 16]) >>> 16),
                  (x += 65535 & M),
                  (T += M >>> 16),
                  (x += (k += (I += 65535 & S) >>> 16) >>> 16),
                  (I = 65535 & (S = _ = (65535 & I) | (k << 16))),
                  (k = S >>> 16),
                  (x = 65535 & (M = b = (65535 & x) | ((T += x >>> 16) << 16))),
                  (T = M >>> 16),
                  (I +=
                    65535 &
                    (S =
                      ((F >>> 28) | (R << 4)) ^ ((R >>> 2) | (F << 30)) ^ ((R >>> 7) | (F << 25)))),
                  (k += S >>> 16),
                  (x +=
                    65535 &
                    (M =
                      ((R >>> 28) | (F << 4)) ^ ((F >>> 2) | (R << 30)) ^ ((F >>> 7) | (R << 25)))),
                  (T += M >>> 16),
                  (k += (S = (F & D) ^ (F & H) ^ (D & H)) >>> 16),
                  (x += 65535 & (M = (R & P) ^ (R & N) ^ (P & N))),
                  (T += M >>> 16),
                  (l =
                    (65535 & (x += (k += (I += 65535 & S) >>> 16) >>> 16)) |
                    ((T += x >>> 16) << 16)),
                  (v = (65535 & I) | (k << 16)),
                  (I = 65535 & (S = y)),
                  (k = S >>> 16),
                  (x = 65535 & (M = a)),
                  (T = M >>> 16),
                  (k += (S = _) >>> 16),
                  (x += 65535 & (M = b)),
                  (T += M >>> 16),
                  (P = i),
                  (N = o),
                  (U = s),
                  (B = a =
                    (65535 & (x += (k += (I += 65535 & S) >>> 16) >>> 16)) |
                    ((T += x >>> 16) << 16)),
                  (K = c),
                  (L = u),
                  (j = h),
                  (R = l),
                  (D = f),
                  (H = d),
                  (q = p),
                  ($ = y = (65535 & I) | (k << 16)),
                  (z = m),
                  (G = g),
                  (X = w),
                  (F = v),
                  E % 16 == 15)
                )
                  for (A = 0; A < 16; A++)
                    (M = O[A]),
                      (I = 65535 & (S = C[A])),
                      (k = S >>> 16),
                      (x = 65535 & M),
                      (T = M >>> 16),
                      (M = O[(A + 9) % 16]),
                      (I += 65535 & (S = C[(A + 9) % 16])),
                      (k += S >>> 16),
                      (x += 65535 & M),
                      (T += M >>> 16),
                      (b = O[(A + 1) % 16]),
                      (I +=
                        65535 &
                        (S =
                          (((_ = C[(A + 1) % 16]) >>> 1) | (b << 31)) ^
                          ((_ >>> 8) | (b << 24)) ^
                          ((_ >>> 7) | (b << 25)))),
                      (k += S >>> 16),
                      (x +=
                        65535 &
                        (M = ((b >>> 1) | (_ << 31)) ^ ((b >>> 8) | (_ << 24)) ^ (b >>> 7))),
                      (T += M >>> 16),
                      (b = O[(A + 14) % 16]),
                      (k +=
                        (S =
                          (((_ = C[(A + 14) % 16]) >>> 19) | (b << 13)) ^
                          ((b >>> 29) | (_ << 3)) ^
                          ((_ >>> 6) | (b << 26))) >>> 16),
                      (x +=
                        65535 &
                        (M = ((b >>> 19) | (_ << 13)) ^ ((_ >>> 29) | (b << 3)) ^ (b >>> 6))),
                      (T += M >>> 16),
                      (T += (x += (k += (I += 65535 & S) >>> 16) >>> 16) >>> 16),
                      (O[A] = (65535 & x) | (T << 16)),
                      (C[A] = (65535 & I) | (k << 16));
              (I = 65535 & (S = F)),
                (k = S >>> 16),
                (x = 65535 & (M = R)),
                (T = M >>> 16),
                (M = t[0]),
                (k += (S = e[0]) >>> 16),
                (x += 65535 & M),
                (T += M >>> 16),
                (T += (x += (k += (I += 65535 & S) >>> 16) >>> 16) >>> 16),
                (t[0] = R = (65535 & x) | (T << 16)),
                (e[0] = F = (65535 & I) | (k << 16)),
                (I = 65535 & (S = D)),
                (k = S >>> 16),
                (x = 65535 & (M = P)),
                (T = M >>> 16),
                (M = t[1]),
                (k += (S = e[1]) >>> 16),
                (x += 65535 & M),
                (T += M >>> 16),
                (T += (x += (k += (I += 65535 & S) >>> 16) >>> 16) >>> 16),
                (t[1] = P = (65535 & x) | (T << 16)),
                (e[1] = D = (65535 & I) | (k << 16)),
                (I = 65535 & (S = H)),
                (k = S >>> 16),
                (x = 65535 & (M = N)),
                (T = M >>> 16),
                (M = t[2]),
                (k += (S = e[2]) >>> 16),
                (x += 65535 & M),
                (T += M >>> 16),
                (T += (x += (k += (I += 65535 & S) >>> 16) >>> 16) >>> 16),
                (t[2] = N = (65535 & x) | (T << 16)),
                (e[2] = H = (65535 & I) | (k << 16)),
                (I = 65535 & (S = q)),
                (k = S >>> 16),
                (x = 65535 & (M = U)),
                (T = M >>> 16),
                (M = t[3]),
                (k += (S = e[3]) >>> 16),
                (x += 65535 & M),
                (T += M >>> 16),
                (T += (x += (k += (I += 65535 & S) >>> 16) >>> 16) >>> 16),
                (t[3] = U = (65535 & x) | (T << 16)),
                (e[3] = q = (65535 & I) | (k << 16)),
                (I = 65535 & (S = $)),
                (k = S >>> 16),
                (x = 65535 & (M = B)),
                (T = M >>> 16),
                (M = t[4]),
                (k += (S = e[4]) >>> 16),
                (x += 65535 & M),
                (T += M >>> 16),
                (T += (x += (k += (I += 65535 & S) >>> 16) >>> 16) >>> 16),
                (t[4] = B = (65535 & x) | (T << 16)),
                (e[4] = $ = (65535 & I) | (k << 16)),
                (I = 65535 & (S = z)),
                (k = S >>> 16),
                (x = 65535 & (M = K)),
                (T = M >>> 16),
                (M = t[5]),
                (k += (S = e[5]) >>> 16),
                (x += 65535 & M),
                (T += M >>> 16),
                (T += (x += (k += (I += 65535 & S) >>> 16) >>> 16) >>> 16),
                (t[5] = K = (65535 & x) | (T << 16)),
                (e[5] = z = (65535 & I) | (k << 16)),
                (I = 65535 & (S = G)),
                (k = S >>> 16),
                (x = 65535 & (M = L)),
                (T = M >>> 16),
                (M = t[6]),
                (k += (S = e[6]) >>> 16),
                (x += 65535 & M),
                (T += M >>> 16),
                (T += (x += (k += (I += 65535 & S) >>> 16) >>> 16) >>> 16),
                (t[6] = L = (65535 & x) | (T << 16)),
                (e[6] = G = (65535 & I) | (k << 16)),
                (I = 65535 & (S = X)),
                (k = S >>> 16),
                (x = 65535 & (M = j)),
                (T = M >>> 16),
                (M = t[7]),
                (k += (S = e[7]) >>> 16),
                (x += 65535 & M),
                (T += M >>> 16),
                (T += (x += (k += (I += 65535 & S) >>> 16) >>> 16) >>> 16),
                (t[7] = j = (65535 & x) | (T << 16)),
                (e[7] = X = (65535 & I) | (k << 16)),
                (W += 128),
                (n -= 128);
            }
            return n;
          }

          function Y(t, e, r) {
            var n,
              i = new Int32Array(8),
              o = new Int32Array(8),
              s = new Uint8Array(256),
              a = r;
            for (
              i[0] = 1779033703,
                i[1] = 3144134277,
                i[2] = 1013904242,
                i[3] = 2773480762,
                i[4] = 1359893119,
                i[5] = 2600822924,
                i[6] = 528734635,
                i[7] = 1541459225,
                o[0] = 4089235720,
                o[1] = 2227873595,
                o[2] = 4271175723,
                o[3] = 1595750129,
                o[4] = 2917565137,
                o[5] = 725511199,
                o[6] = 4215389547,
                o[7] = 327033209,
                V(i, o, e, r),
                r %= 128,
                n = 0;
              n < r;
              n++
            )
              s[n] = e[a - r + n];
            for (
              s[r] = 128,
                s[(r = 256 - 128 * (r < 112 ? 1 : 0)) - 9] = 0,
                p(s, r - 8, (a / 536870912) | 0, a << 3),
                V(i, o, s, r),
                n = 0;
              n < 8;
              n++
            )
              p(t, 8 * n, i[n], o[n]);
            return 0;
          }

          function Z(t, r) {
            var n = e(),
              i = e(),
              o = e(),
              s = e(),
              a = e(),
              c = e(),
              u = e(),
              l = e(),
              f = e();
            L(n, t[1], t[0]),
              L(f, r[1], r[0]),
              j(n, n, f),
              K(i, t[0], t[1]),
              K(f, r[0], r[1]),
              j(i, i, f),
              j(o, t[3], r[3]),
              j(o, o, h),
              j(s, t[2], r[2]),
              K(s, s, s),
              L(a, i, n),
              L(c, s, o),
              K(u, s, o),
              K(l, i, n),
              j(t[0], a, c),
              j(t[1], l, u),
              j(t[2], u, c),
              j(t[3], a, l);
          }

          function Q(t, e, r) {
            var n;
            for (n = 0; n < 4; n++) R(t[n], e[n], r);
          }

          function tt(t, r) {
            var n = e(),
              i = e(),
              o = e();
            D(o, r[2]), j(n, r[0], o), j(i, r[1], o), P(t, i), (t[31] ^= U(n) << 7);
          }

          function et(t, e, r) {
            var n, i;
            for (O(t[0], s), O(t[1], a), O(t[2], a), O(t[3], s), i = 255; i >= 0; --i)
              Q(t, e, (n = (r[(i / 8) | 0] >> (7 & i)) & 1)), Z(e, t), Z(t, t), Q(t, e, n);
          }

          function rt(t, r) {
            var n = [e(), e(), e(), e()];
            O(n[0], l), O(n[1], f), O(n[2], a), j(n[3], l, f), et(t, n, r);
          }

          function nt(t, r, i) {
            var o,
              s = new Uint8Array(64),
              a = [e(), e(), e(), e()];
            for (
              i || n(r, 32),
                Y(s, r, 32),
                s[0] &= 248,
                s[31] &= 127,
                s[31] |= 64,
                rt(a, s),
                tt(t, a),
                o = 0;
              o < 32;
              o++
            )
              r[o + 32] = t[o];
            return 0;
          }
          var it = new Float64Array([
            237, 211, 245, 92, 26, 99, 18, 88, 214, 156, 247, 162, 222, 249, 222, 20, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16,
          ]);

          function ot(t, e) {
            var r, n, i, o;
            for (n = 63; n >= 32; --n) {
              for (r = 0, i = n - 32, o = n - 12; i < o; ++i)
                (e[i] += r - 16 * e[n] * it[i - (n - 32)]),
                  (r = Math.floor((e[i] + 128) / 256)),
                  (e[i] -= 256 * r);
              (e[i] += r), (e[n] = 0);
            }
            for (r = 0, i = 0; i < 32; i++)
              (e[i] += r - (e[31] >> 4) * it[i]), (r = e[i] >> 8), (e[i] &= 255);
            for (i = 0; i < 32; i++) e[i] -= r * it[i];
            for (n = 0; n < 32; n++) (e[n + 1] += e[n] >> 8), (t[n] = 255 & e[n]);
          }

          function st(t) {
            var e,
              r = new Float64Array(64);
            for (e = 0; e < 64; e++) r[e] = t[e];
            for (e = 0; e < 64; e++) t[e] = 0;
            ot(t, r);
          }

          function at(t, r, n, i) {
            var o,
              s,
              a = new Uint8Array(64),
              c = new Uint8Array(64),
              u = new Uint8Array(64),
              h = new Float64Array(64),
              l = [e(), e(), e(), e()];
            Y(a, i, 32), (a[0] &= 248), (a[31] &= 127), (a[31] |= 64);
            var f = n + 64;
            for (o = 0; o < n; o++) t[64 + o] = r[o];
            for (o = 0; o < 32; o++) t[32 + o] = a[32 + o];
            for (Y(u, t.subarray(32), n + 32), st(u), rt(l, u), tt(t, l), o = 32; o < 64; o++)
              t[o] = i[o];
            for (Y(c, t, n + 64), st(c), o = 0; o < 64; o++) h[o] = 0;
            for (o = 0; o < 32; o++) h[o] = u[o];
            for (o = 0; o < 32; o++) for (s = 0; s < 32; s++) h[o + s] += c[o] * a[s];
            return ot(t.subarray(32), h), f;
          }

          function ct(t, r, n, i) {
            var o,
              c = new Uint8Array(32),
              h = new Uint8Array(64),
              l = [e(), e(), e(), e()],
              f = [e(), e(), e(), e()];
            if (n < 64) return -1;
            if (
              (function (t, r) {
                var n = e(),
                  i = e(),
                  o = e(),
                  c = e(),
                  h = e(),
                  l = e(),
                  f = e();
                return (
                  O(t[2], a),
                  B(t[1], r),
                  F(o, t[1]),
                  j(c, o, u),
                  L(o, o, t[2]),
                  K(c, t[2], c),
                  F(h, c),
                  F(l, h),
                  j(f, l, h),
                  j(n, f, o),
                  j(n, n, c),
                  H(n, n),
                  j(n, n, o),
                  j(n, n, c),
                  j(n, n, c),
                  j(t[0], n, c),
                  F(i, t[0]),
                  j(i, i, c),
                  N(i, o) && j(t[0], t[0], d),
                  F(i, t[0]),
                  j(i, i, c),
                  N(i, o)
                    ? -1
                    : (U(t[0]) === r[31] >> 7 && L(t[0], s, t[0]), j(t[3], t[0], t[1]), 0)
                );
              })(f, i)
            )
              return -1;
            for (o = 0; o < n; o++) t[o] = r[o];
            for (o = 0; o < 32; o++) t[o + 32] = i[o];
            if (
              (Y(h, t, n),
              st(h),
              et(l, f, h),
              rt(f, r.subarray(32)),
              Z(l, f),
              tt(c, l),
              (n -= 64),
              g(r, 0, c, 0))
            ) {
              for (o = 0; o < n; o++) t[o] = 0;
              return -1;
            }
            for (o = 0; o < n; o++) t[o] = r[o + 64];
            return n;
          }
          var ut = 16,
            ht = 64,
            lt = 32,
            ft = 64;

          function dt(t, e) {
            if (32 !== t.length) throw new Error("bad key size");
            if (24 !== e.length) throw new Error("bad nonce size");
          }

          function pt() {
            for (var t = 0; t < arguments.length; t++)
              if (!(arguments[t] instanceof Uint8Array))
                throw new TypeError("unexpected type, use Uint8Array");
          }

          function yt(t) {
            for (var e = 0; e < t.length; e++) t[e] = 0;
          }
          (t.lowlevel = {
            crypto_core_hsalsa20: v,
            crypto_stream_xor: M,
            crypto_stream: A,
            crypto_stream_salsa20_xor: _,
            crypto_stream_salsa20: E,
            crypto_onetimeauth: I,
            crypto_onetimeauth_verify: k,
            crypto_verify_16: m,
            crypto_verify_32: g,
            crypto_secretbox: x,
            crypto_secretbox_open: T,
            crypto_scalarmult: q,
            crypto_scalarmult_base: $,
            crypto_box_beforenm: G,
            crypto_box_afternm: X,
            crypto_box: function (t, e, r, n, i, o) {
              var s = new Uint8Array(32);
              return G(s, i, o), X(t, e, r, n, s);
            },
            crypto_box_open: function (t, e, r, n, i, o) {
              var s = new Uint8Array(32);
              return G(s, i, o), W(t, e, r, n, s);
            },
            crypto_box_keypair: z,
            crypto_hash: Y,
            crypto_sign: at,
            crypto_sign_keypair: nt,
            crypto_sign_open: ct,
            crypto_secretbox_KEYBYTES: 32,
            crypto_secretbox_NONCEBYTES: 24,
            crypto_secretbox_ZEROBYTES: 32,
            crypto_secretbox_BOXZEROBYTES: ut,
            crypto_scalarmult_BYTES: 32,
            crypto_scalarmult_SCALARBYTES: 32,
            crypto_box_PUBLICKEYBYTES: 32,
            crypto_box_SECRETKEYBYTES: 32,
            crypto_box_BEFORENMBYTES: 32,
            crypto_box_NONCEBYTES: 24,
            crypto_box_ZEROBYTES: 32,
            crypto_box_BOXZEROBYTES: 16,
            crypto_sign_BYTES: ht,
            crypto_sign_PUBLICKEYBYTES: lt,
            crypto_sign_SECRETKEYBYTES: ft,
            crypto_sign_SEEDBYTES: 32,
            crypto_hash_BYTES: 64,
            gf: e,
            D: u,
            L: it,
            pack25519: P,
            unpack25519: B,
            M: j,
            A: K,
            S: F,
            Z: L,
            pow2523: H,
            add: Z,
            set25519: O,
            modL: ot,
            scalarmult: et,
            scalarbase: rt,
          }),
            (t.randomBytes = function (t) {
              var e = new Uint8Array(t);
              return n(e, t), e;
            }),
            (t.secretbox = function (t, e, r) {
              pt(t, e, r), dt(r, e);
              for (
                var n = new Uint8Array(32 + t.length), i = new Uint8Array(n.length), o = 0;
                o < t.length;
                o++
              )
                n[o + 32] = t[o];
              return x(i, n, n.length, e, r), i.subarray(ut);
            }),
            (t.secretbox.open = function (t, e, r) {
              pt(t, e, r), dt(r, e);
              for (
                var n = new Uint8Array(ut + t.length), i = new Uint8Array(n.length), o = 0;
                o < t.length;
                o++
              )
                n[o + ut] = t[o];
              return n.length < 32 || 0 !== T(i, n, n.length, e, r) ? null : i.subarray(32);
            }),
            (t.secretbox.keyLength = 32),
            (t.secretbox.nonceLength = 24),
            (t.secretbox.overheadLength = ut),
            (t.scalarMult = function (t, e) {
              if ((pt(t, e), 32 !== t.length)) throw new Error("bad n size");
              if (32 !== e.length) throw new Error("bad p size");
              var r = new Uint8Array(32);
              return q(r, t, e), r;
            }),
            (t.scalarMult.base = function (t) {
              if ((pt(t), 32 !== t.length)) throw new Error("bad n size");
              var e = new Uint8Array(32);
              return $(e, t), e;
            }),
            (t.scalarMult.scalarLength = 32),
            (t.scalarMult.groupElementLength = 32),
            (t.box = function (e, r, n, i) {
              var o = t.box.before(n, i);
              return t.secretbox(e, r, o);
            }),
            (t.box.before = function (t, e) {
              pt(t, e),
                (function (t, e) {
                  if (32 !== t.length) throw new Error("bad public key size");
                  if (32 !== e.length) throw new Error("bad secret key size");
                })(t, e);
              var r = new Uint8Array(32);
              return G(r, t, e), r;
            }),
            (t.box.after = t.secretbox),
            (t.box.open = function (e, r, n, i) {
              var o = t.box.before(n, i);
              return t.secretbox.open(e, r, o);
            }),
            (t.box.open.after = t.secretbox.open),
            (t.box.keyPair = function () {
              var t = new Uint8Array(32),
                e = new Uint8Array(32);
              return (
                z(t, e),
                {
                  publicKey: t,
                  secretKey: e,
                }
              );
            }),
            (t.box.keyPair.fromSecretKey = function (t) {
              if ((pt(t), 32 !== t.length)) throw new Error("bad secret key size");
              var e = new Uint8Array(32);
              return (
                $(e, t),
                {
                  publicKey: e,
                  secretKey: new Uint8Array(t),
                }
              );
            }),
            (t.box.publicKeyLength = 32),
            (t.box.secretKeyLength = 32),
            (t.box.sharedKeyLength = 32),
            (t.box.nonceLength = 24),
            (t.box.overheadLength = t.secretbox.overheadLength),
            (t.sign = function (t, e) {
              if ((pt(t, e), e.length !== ft)) throw new Error("bad secret key size");
              var r = new Uint8Array(ht + t.length);
              return at(r, t, t.length, e), r;
            }),
            (t.sign.open = function (t, e) {
              if ((pt(t, e), e.length !== lt)) throw new Error("bad public key size");
              var r = new Uint8Array(t.length),
                n = ct(r, t, t.length, e);
              if (n < 0) return null;
              for (var i = new Uint8Array(n), o = 0; o < i.length; o++) i[o] = r[o];
              return i;
            }),
            (t.sign.detached = function (e, r) {
              for (var n = t.sign(e, r), i = new Uint8Array(ht), o = 0; o < i.length; o++)
                i[o] = n[o];
              return i;
            }),
            (t.sign.detached.verify = function (t, e, r) {
              if ((pt(t, e, r), e.length !== ht)) throw new Error("bad signature size");
              if (r.length !== lt) throw new Error("bad public key size");
              var n,
                i = new Uint8Array(ht + t.length),
                o = new Uint8Array(ht + t.length);
              for (n = 0; n < ht; n++) i[n] = e[n];
              for (n = 0; n < t.length; n++) i[n + ht] = t[n];
              return ct(o, i, i.length, r) >= 0;
            }),
            (t.sign.keyPair = function () {
              var t = new Uint8Array(lt),
                e = new Uint8Array(ft);
              return (
                nt(t, e),
                {
                  publicKey: t,
                  secretKey: e,
                }
              );
            }),
            (t.sign.keyPair.fromSecretKey = function (t) {
              if ((pt(t), t.length !== ft)) throw new Error("bad secret key size");
              for (var e = new Uint8Array(lt), r = 0; r < e.length; r++) e[r] = t[32 + r];
              return {
                publicKey: e,
                secretKey: new Uint8Array(t),
              };
            }),
            (t.sign.keyPair.fromSeed = function (t) {
              if ((pt(t), 32 !== t.length)) throw new Error("bad seed size");
              for (var e = new Uint8Array(lt), r = new Uint8Array(ft), n = 0; n < 32; n++)
                r[n] = t[n];
              return (
                nt(e, r, !0),
                {
                  publicKey: e,
                  secretKey: r,
                }
              );
            }),
            (t.sign.publicKeyLength = lt),
            (t.sign.secretKeyLength = ft),
            (t.sign.seedLength = 32),
            (t.sign.signatureLength = ht),
            (t.hash = function (t) {
              pt(t);
              var e = new Uint8Array(64);
              return Y(e, t, t.length), e;
            }),
            (t.hash.hashLength = 64),
            (t.verify = function (t, e) {
              return (
                pt(t, e),
                0 !== t.length &&
                  0 !== e.length &&
                  t.length === e.length &&
                  0 === y(t, 0, e, 0, t.length)
              );
            }),
            (t.setPRNG = function (t) {
              n = t;
            }),
            (function () {
              var e = "undefined" != typeof self ? self.crypto || self.msCrypto : null;
              if (e && e.getRandomValues) {
                t.setPRNG(function (t, r) {
                  var n,
                    i = new Uint8Array(r);
                  for (n = 0; n < r; n += 65536)
                    e.getRandomValues(i.subarray(n, n + Math.min(r - n, 65536)));
                  for (n = 0; n < r; n++) t[n] = i[n];
                  yt(i);
                });
              } else
                (e = r(55024)) &&
                  e.randomBytes &&
                  t.setPRNG(function (t, r) {
                    var n,
                      i = e.randomBytes(r);
                    for (n = 0; n < r; n++) t[n] = i[n];
                    yt(i);
                  });
            })();
        })(t.exports ? t.exports : (self.nacl = self.nacl || {}));
      },
      17514: (t, e, r) => {
        t.exports = r(8612);
      },
      23880: (t) => {
        t.exports = function (t) {
          var e,
            r = !1;
          return (
            t instanceof Function || ((r = !0), (e = t), (t = null)),
            function () {
              return r || ((r = !0), (e = t.apply(this, arguments)), (t = null)), e;
            }
          );
        };
      },
      73148: (t) => {
        t.exports = function t(e, r, n) {
          if ((n || (n = []), n.length < e.length)) {
            var i = e[n.length];
            for (var o in i) (n[n.length] = i[o]), t(e, r, n), --n.length;
          } else r.apply(null, n);
        };
      },
      8612: (t, e, r) => {
        t.exports = {
          cache: r(23880),
          eachCombination: r(73148),
        };
      },
      46601: () => {},
      55024: () => {},
      56527: (t) => {
        t.exports = JSON.parse(
          '{"schema":{"BadUTF16":{"name":"BadUTF16","subtypes":[],"props":{}},"BadUTF8":{"name":"BadUTF8","subtypes":[],"props":{}},"BalanceExceeded":{"name":"BalanceExceeded","subtypes":[],"props":{}},"BreakpointTrap":{"name":"BreakpointTrap","subtypes":[],"props":{}},"CacheError":{"name":"CacheError","subtypes":["ReadError","WriteError","DeserializationError","SerializationError"],"props":{}},"CallIndirectOOB":{"name":"CallIndirectOOB","subtypes":[],"props":{}},"CannotAppendActionToJointPromise":{"name":"CannotAppendActionToJointPromise","subtypes":[],"props":{}},"CannotReturnJointPromise":{"name":"CannotReturnJointPromise","subtypes":[],"props":{}},"CodeDoesNotExist":{"name":"CodeDoesNotExist","subtypes":[],"props":{"account_id":""}},"CompilationError":{"name":"CompilationError","subtypes":["CodeDoesNotExist","PrepareError","WasmerCompileError"],"props":{}},"ContractSizeExceeded":{"name":"ContractSizeExceeded","subtypes":[],"props":{"limit":"","size":""}},"Deprecated":{"name":"Deprecated","subtypes":[],"props":{"method_name":""}},"Deserialization":{"name":"Deserialization","subtypes":[],"props":{}},"DeserializationError":{"name":"DeserializationError","subtypes":[],"props":{}},"EmptyMethodName":{"name":"EmptyMethodName","subtypes":[],"props":{}},"FunctionCallError":{"name":"FunctionCallError","subtypes":["CompilationError","LinkError","MethodResolveError","WasmTrap","WasmUnknownError","HostError","EvmError"],"props":{}},"GasExceeded":{"name":"GasExceeded","subtypes":[],"props":{}},"GasInstrumentation":{"name":"GasInstrumentation","subtypes":[],"props":{}},"GasLimitExceeded":{"name":"GasLimitExceeded","subtypes":[],"props":{}},"GenericTrap":{"name":"GenericTrap","subtypes":[],"props":{}},"GuestPanic":{"name":"GuestPanic","subtypes":[],"props":{"panic_msg":""}},"HostError":{"name":"HostError","subtypes":["BadUTF16","BadUTF8","GasExceeded","GasLimitExceeded","BalanceExceeded","EmptyMethodName","GuestPanic","IntegerOverflow","InvalidPromiseIndex","CannotAppendActionToJointPromise","CannotReturnJointPromise","InvalidPromiseResultIndex","InvalidRegisterId","IteratorWasInvalidated","MemoryAccessViolation","InvalidReceiptIndex","InvalidIteratorIndex","InvalidAccountId","InvalidMethodName","InvalidPublicKey","ProhibitedInView","NumberOfLogsExceeded","KeyLengthExceeded","ValueLengthExceeded","TotalLogLengthExceeded","NumberPromisesExceeded","NumberInputDataDependenciesExceeded","ReturnedValueLengthExceeded","ContractSizeExceeded","Deprecated"],"props":{}},"IllegalArithmetic":{"name":"IllegalArithmetic","subtypes":[],"props":{}},"IncorrectCallIndirectSignature":{"name":"IncorrectCallIndirectSignature","subtypes":[],"props":{}},"Instantiate":{"name":"Instantiate","subtypes":[],"props":{}},"IntegerOverflow":{"name":"IntegerOverflow","subtypes":[],"props":{}},"InternalMemoryDeclared":{"name":"InternalMemoryDeclared","subtypes":[],"props":{}},"InvalidAccountId":{"name":"InvalidAccountId","subtypes":[],"props":{"account_id":""}},"InvalidIteratorIndex":{"name":"InvalidIteratorIndex","subtypes":[],"props":{"iterator_index":""}},"InvalidMethodName":{"name":"InvalidMethodName","subtypes":[],"props":{}},"InvalidPromiseIndex":{"name":"InvalidPromiseIndex","subtypes":[],"props":{"promise_idx":""}},"InvalidPromiseResultIndex":{"name":"InvalidPromiseResultIndex","subtypes":[],"props":{"result_idx":""}},"InvalidPublicKey":{"name":"InvalidPublicKey","subtypes":[],"props":{}},"InvalidReceiptIndex":{"name":"InvalidReceiptIndex","subtypes":[],"props":{"receipt_index":""}},"InvalidRegisterId":{"name":"InvalidRegisterId","subtypes":[],"props":{"register_id":""}},"IteratorWasInvalidated":{"name":"IteratorWasInvalidated","subtypes":[],"props":{"iterator_index":""}},"KeyLengthExceeded":{"name":"KeyLengthExceeded","subtypes":[],"props":{"length":"","limit":""}},"LinkError":{"name":"LinkError","subtypes":[],"props":{"msg":""}},"Memory":{"name":"Memory","subtypes":[],"props":{}},"MemoryAccessViolation":{"name":"MemoryAccessViolation","subtypes":[],"props":{}},"MemoryOutOfBounds":{"name":"MemoryOutOfBounds","subtypes":[],"props":{}},"MethodEmptyName":{"name":"MethodEmptyName","subtypes":[],"props":{}},"MethodInvalidSignature":{"name":"MethodInvalidSignature","subtypes":[],"props":{}},"MethodNotFound":{"name":"MethodNotFound","subtypes":[],"props":{}},"MethodResolveError":{"name":"MethodResolveError","subtypes":["MethodEmptyName","MethodUTF8Error","MethodNotFound","MethodInvalidSignature"],"props":{}},"MethodUTF8Error":{"name":"MethodUTF8Error","subtypes":[],"props":{}},"MisalignedAtomicAccess":{"name":"MisalignedAtomicAccess","subtypes":[],"props":{}},"NumberInputDataDependenciesExceeded":{"name":"NumberInputDataDependenciesExceeded","subtypes":[],"props":{"limit":"","number_of_input_data_dependencies":""}},"NumberOfLogsExceeded":{"name":"NumberOfLogsExceeded","subtypes":[],"props":{"limit":""}},"NumberPromisesExceeded":{"name":"NumberPromisesExceeded","subtypes":[],"props":{"limit":"","number_of_promises":""}},"PrepareError":{"name":"PrepareError","subtypes":["Serialization","Deserialization","InternalMemoryDeclared","GasInstrumentation","StackHeightInstrumentation","Instantiate","Memory"],"props":{}},"ProhibitedInView":{"name":"ProhibitedInView","subtypes":[],"props":{"method_name":""}},"ReadError":{"name":"ReadError","subtypes":[],"props":{}},"ReturnedValueLengthExceeded":{"name":"ReturnedValueLengthExceeded","subtypes":[],"props":{"length":"","limit":""}},"Serialization":{"name":"Serialization","subtypes":[],"props":{}},"SerializationError":{"name":"SerializationError","subtypes":[],"props":{"hash":""}},"StackHeightInstrumentation":{"name":"StackHeightInstrumentation","subtypes":[],"props":{}},"StackOverflow":{"name":"StackOverflow","subtypes":[],"props":{}},"TotalLogLengthExceeded":{"name":"TotalLogLengthExceeded","subtypes":[],"props":{"length":"","limit":""}},"Unreachable":{"name":"Unreachable","subtypes":[],"props":{}},"ValueLengthExceeded":{"name":"ValueLengthExceeded","subtypes":[],"props":{"length":"","limit":""}},"WasmTrap":{"name":"WasmTrap","subtypes":["Unreachable","IncorrectCallIndirectSignature","MemoryOutOfBounds","CallIndirectOOB","IllegalArithmetic","MisalignedAtomicAccess","BreakpointTrap","StackOverflow","GenericTrap"],"props":{}},"WasmUnknownError":{"name":"WasmUnknownError","subtypes":[],"props":{}},"WasmerCompileError":{"name":"WasmerCompileError","subtypes":[],"props":{"msg":""}},"WriteError":{"name":"WriteError","subtypes":[],"props":{}},"AccessKeyNotFound":{"name":"AccessKeyNotFound","subtypes":[],"props":{"account_id":"","public_key":""}},"AccountAlreadyExists":{"name":"AccountAlreadyExists","subtypes":[],"props":{"account_id":""}},"AccountDoesNotExist":{"name":"AccountDoesNotExist","subtypes":[],"props":{"account_id":""}},"ActionError":{"name":"ActionError","subtypes":["AccountAlreadyExists","AccountDoesNotExist","CreateAccountOnlyByRegistrar","CreateAccountNotAllowed","ActorNoPermission","DeleteKeyDoesNotExist","AddKeyAlreadyExists","DeleteAccountStaking","LackBalanceForState","TriesToUnstake","TriesToStake","InsufficientStake","FunctionCallError","NewReceiptValidationError","OnlyImplicitAccountCreationAllowed"],"props":{"index":""}},"ActionsValidationError":{"name":"ActionsValidationError","subtypes":["DeleteActionMustBeFinal","TotalPrepaidGasExceeded","TotalNumberOfActionsExceeded","AddKeyMethodNamesNumberOfBytesExceeded","AddKeyMethodNameLengthExceeded","IntegerOverflow","InvalidAccountId","ContractSizeExceeded","FunctionCallMethodNameLengthExceeded","FunctionCallArgumentsLengthExceeded","UnsuitableStakingKey","FunctionCallZeroAttachedGas"],"props":{}},"ActorNoPermission":{"name":"ActorNoPermission","subtypes":[],"props":{"account_id":"","actor_id":""}},"AddKeyAlreadyExists":{"name":"AddKeyAlreadyExists","subtypes":[],"props":{"account_id":"","public_key":""}},"AddKeyMethodNameLengthExceeded":{"name":"AddKeyMethodNameLengthExceeded","subtypes":[],"props":{"length":"","limit":""}},"AddKeyMethodNamesNumberOfBytesExceeded":{"name":"AddKeyMethodNamesNumberOfBytesExceeded","subtypes":[],"props":{"limit":"","total_number_of_bytes":""}},"BalanceMismatchError":{"name":"BalanceMismatchError","subtypes":[],"props":{"final_accounts_balance":"","final_postponed_receipts_balance":"","incoming_receipts_balance":"","incoming_validator_rewards":"","initial_accounts_balance":"","initial_postponed_receipts_balance":"","new_delayed_receipts_balance":"","other_burnt_amount":"","outgoing_receipts_balance":"","processed_delayed_receipts_balance":"","slashed_burnt_amount":"","tx_burnt_amount":""}},"CostOverflow":{"name":"CostOverflow","subtypes":[],"props":{}},"CreateAccountNotAllowed":{"name":"CreateAccountNotAllowed","subtypes":[],"props":{"account_id":"","predecessor_id":""}},"CreateAccountOnlyByRegistrar":{"name":"CreateAccountOnlyByRegistrar","subtypes":[],"props":{"account_id":"","predecessor_id":"","registrar_account_id":""}},"DeleteAccountStaking":{"name":"DeleteAccountStaking","subtypes":[],"props":{"account_id":""}},"DeleteActionMustBeFinal":{"name":"DeleteActionMustBeFinal","subtypes":[],"props":{}},"DeleteKeyDoesNotExist":{"name":"DeleteKeyDoesNotExist","subtypes":[],"props":{"account_id":"","public_key":""}},"DepositWithFunctionCall":{"name":"DepositWithFunctionCall","subtypes":[],"props":{}},"Expired":{"name":"Expired","subtypes":[],"props":{}},"FunctionCallArgumentsLengthExceeded":{"name":"FunctionCallArgumentsLengthExceeded","subtypes":[],"props":{"length":"","limit":""}},"FunctionCallMethodNameLengthExceeded":{"name":"FunctionCallMethodNameLengthExceeded","subtypes":[],"props":{"length":"","limit":""}},"FunctionCallZeroAttachedGas":{"name":"FunctionCallZeroAttachedGas","subtypes":[],"props":{}},"InsufficientStake":{"name":"InsufficientStake","subtypes":[],"props":{"account_id":"","minimum_stake":"","stake":""}},"InvalidAccessKeyError":{"name":"InvalidAccessKeyError","subtypes":["AccessKeyNotFound","ReceiverMismatch","MethodNameMismatch","RequiresFullAccess","NotEnoughAllowance","DepositWithFunctionCall"],"props":{}},"InvalidChain":{"name":"InvalidChain","subtypes":[],"props":{}},"InvalidDataReceiverId":{"name":"InvalidDataReceiverId","subtypes":[],"props":{"account_id":""}},"InvalidNonce":{"name":"InvalidNonce","subtypes":[],"props":{"ak_nonce":"","tx_nonce":""}},"InvalidPredecessorId":{"name":"InvalidPredecessorId","subtypes":[],"props":{"account_id":""}},"InvalidReceiverId":{"name":"InvalidReceiverId","subtypes":[],"props":{"account_id":""}},"InvalidSignature":{"name":"InvalidSignature","subtypes":[],"props":{}},"InvalidSignerId":{"name":"InvalidSignerId","subtypes":[],"props":{"account_id":""}},"InvalidTxError":{"name":"InvalidTxError","subtypes":["InvalidAccessKeyError","InvalidSignerId","SignerDoesNotExist","InvalidNonce","InvalidReceiverId","InvalidSignature","NotEnoughBalance","LackBalanceForState","CostOverflow","InvalidChain","Expired","ActionsValidation"],"props":{}},"LackBalanceForState":{"name":"LackBalanceForState","subtypes":[],"props":{"account_id":"","amount":""}},"MethodNameMismatch":{"name":"MethodNameMismatch","subtypes":[],"props":{"method_name":""}},"NotEnoughAllowance":{"name":"NotEnoughAllowance","subtypes":[],"props":{"account_id":"","allowance":"","cost":"","public_key":""}},"NotEnoughBalance":{"name":"NotEnoughBalance","subtypes":[],"props":{"balance":"","cost":"","signer_id":""}},"OnlyImplicitAccountCreationAllowed":{"name":"OnlyImplicitAccountCreationAllowed","subtypes":[],"props":{"account_id":""}},"ReceiptValidationError":{"name":"ReceiptValidationError","subtypes":["InvalidPredecessorId","InvalidReceiverId","InvalidSignerId","InvalidDataReceiverId","ReturnedValueLengthExceeded","NumberInputDataDependenciesExceeded","ActionsValidation"],"props":{}},"ReceiverMismatch":{"name":"ReceiverMismatch","subtypes":[],"props":{"ak_receiver":"","tx_receiver":""}},"RequiresFullAccess":{"name":"RequiresFullAccess","subtypes":[],"props":{}},"SignerDoesNotExist":{"name":"SignerDoesNotExist","subtypes":[],"props":{"signer_id":""}},"TotalNumberOfActionsExceeded":{"name":"TotalNumberOfActionsExceeded","subtypes":[],"props":{"limit":"","total_number_of_actions":""}},"TotalPrepaidGasExceeded":{"name":"TotalPrepaidGasExceeded","subtypes":[],"props":{"limit":"","total_prepaid_gas":""}},"TriesToStake":{"name":"TriesToStake","subtypes":[],"props":{"account_id":"","balance":"","locked":"","stake":""}},"TriesToUnstake":{"name":"TriesToUnstake","subtypes":[],"props":{"account_id":""}},"TxExecutionError":{"name":"TxExecutionError","subtypes":["ActionError","InvalidTxError"],"props":{}},"UnsuitableStakingKey":{"name":"UnsuitableStakingKey","subtypes":[],"props":{"public_key":""}},"Closed":{"name":"Closed","subtypes":[],"props":{}},"InternalError":{"name":"InternalError","subtypes":[],"props":{}},"ServerError":{"name":"ServerError","subtypes":["TxExecutionError","Timeout","Closed","InternalError"],"props":{}},"Timeout":{"name":"Timeout","subtypes":[],"props":{}}}}',
        );
      },
      87930: (t) => {
        t.exports = JSON.parse(
          '{"GasLimitExceeded":"Exceeded the maximum amount of gas allowed to burn per contract","MethodEmptyName":"Method name is empty","WasmerCompileError":"Wasmer compilation error: {{msg}}","GuestPanic":"Smart contract panicked: {{panic_msg}}","Memory":"Error creating Wasm memory","GasExceeded":"Exceeded the prepaid gas","MethodUTF8Error":"Method name is not valid UTF8 string","BadUTF16":"String encoding is bad UTF-16 sequence","WasmTrap":"WebAssembly trap: {{msg}}","GasInstrumentation":"Gas instrumentation failed or contract has denied instructions.","InvalidPromiseIndex":"{{promise_idx}} does not correspond to existing promises","InvalidPromiseResultIndex":"Accessed invalid promise result index: {{result_idx}}","Deserialization":"Error happened while deserializing the module","MethodNotFound":"Contract method is not found","InvalidRegisterId":"Accessed invalid register id: {{register_id}}","InvalidReceiptIndex":"VM Logic returned an invalid receipt index: {{receipt_index}}","EmptyMethodName":"Method name is empty in contract call","CannotReturnJointPromise":"Returning joint promise is currently prohibited","StackHeightInstrumentation":"Stack instrumentation failed","CodeDoesNotExist":"Cannot find contract code for account {{account_id}}","MethodInvalidSignature":"Invalid method signature","IntegerOverflow":"Integer overflow happened during contract execution","MemoryAccessViolation":"MemoryAccessViolation","InvalidIteratorIndex":"Iterator index {{iterator_index}} does not exist","IteratorWasInvalidated":"Iterator {{iterator_index}} was invalidated after its creation by performing a mutable operation on trie","InvalidAccountId":"VM Logic returned an invalid account id","Serialization":"Error happened while serializing the module","CannotAppendActionToJointPromise":"Actions can only be appended to non-joint promise.","InternalMemoryDeclared":"Internal memory declaration has been found in the module","Instantiate":"Error happened during instantiation","ProhibitedInView":"{{method_name}} is not allowed in view calls","InvalidMethodName":"VM Logic returned an invalid method name","BadUTF8":"String encoding is bad UTF-8 sequence","BalanceExceeded":"Exceeded the account balance","LinkError":"Wasm contract link error: {{msg}}","InvalidPublicKey":"VM Logic provided an invalid public key","ActorNoPermission":"Actor {{actor_id}} doesn\'t have permission to account {{account_id}} to complete the action","LackBalanceForState":"The account {{account_id}} wouldn\'t have enough balance to cover storage, required to have {{amount}} yoctoNEAR more","ReceiverMismatch":"Wrong AccessKey used for transaction: transaction is sent to receiver_id={{tx_receiver}}, but is signed with function call access key that restricted to only use with receiver_id={{ak_receiver}}. Either change receiver_id in your transaction or switch to use a FullAccessKey.","CostOverflow":"Transaction gas or balance cost is too high","InvalidSignature":"Transaction is not signed with the given public key","AccessKeyNotFound":"Signer \\"{{account_id}}\\" doesn\'t have access key with the given public_key {{public_key}}","NotEnoughBalance":"Sender {{signer_id}} does not have enough balance {{#formatNear}}{{balance}}{{/formatNear}} for operation costing {{#formatNear}}{{cost}}{{/formatNear}}","NotEnoughAllowance":"Access Key {account_id}:{public_key} does not have enough balance {{#formatNear}}{{allowance}}{{/formatNear}} for transaction costing {{#formatNear}}{{cost}}{{/formatNear}}","Expired":"Transaction has expired","DeleteAccountStaking":"Account {{account_id}} is staking and can not be deleted","SignerDoesNotExist":"Signer {{signer_id}} does not exist","TriesToStake":"Account {{account_id}} tried to stake {{#formatNear}}{{stake}}{{/formatNear}}, but has staked {{#formatNear}}{{locked}}{{/formatNear}} and only has {{#formatNear}}{{balance}}{{/formatNear}}","AddKeyAlreadyExists":"The public key {{public_key}} is already used for an existing access key","InvalidSigner":"Invalid signer account ID {{signer_id}} according to requirements","CreateAccountNotAllowed":"The new account_id {{account_id}} can\'t be created by {{predecessor_id}}","RequiresFullAccess":"The transaction contains more then one action, but it was signed with an access key which allows transaction to apply only one specific action. To apply more then one actions TX must be signed with a full access key","TriesToUnstake":"Account {{account_id}} is not yet staked, but tried to unstake","InvalidNonce":"Transaction nonce {{tx_nonce}} must be larger than nonce of the used access key {{ak_nonce}}","AccountAlreadyExists":"Can\'t create a new account {{account_id}}, because it already exists","InvalidChain":"Transaction parent block hash doesn\'t belong to the current chain","AccountDoesNotExist":"Can\'t complete the action because account {{account_id}} doesn\'t exist","MethodNameMismatch":"Transaction method name {{method_name}} isn\'t allowed by the access key","DeleteAccountHasRent":"Account {{account_id}} can\'t be deleted. It has {{#formatNear}}{{balance}}{{/formatNear}}, which is enough to cover the rent","DeleteAccountHasEnoughBalance":"Account {{account_id}} can\'t be deleted. It has {{#formatNear}}{{balance}}{{/formatNear}}, which is enough to cover it\'s storage","InvalidReceiver":"Invalid receiver account ID {{receiver_id}} according to requirements","DeleteKeyDoesNotExist":"Account {{account_id}} tries to remove an access key that doesn\'t exist","Timeout":"Timeout exceeded","Closed":"Connection closed"}',
        );
      },
      50855: (t) => {
        t.exports = JSON.parse(
          '{"100":"Continue","101":"Switching Protocols","102":"Processing","103":"Early Hints","200":"OK","201":"Created","202":"Accepted","203":"Non-Authoritative Information","204":"No Content","205":"Reset Content","206":"Partial Content","207":"Multi-Status","208":"Already Reported","226":"IM Used","300":"Multiple Choices","301":"Moved Permanently","302":"Found","303":"See Other","304":"Not Modified","305":"Use Proxy","306":"(Unused)","307":"Temporary Redirect","308":"Permanent Redirect","400":"Bad Request","401":"Unauthorized","402":"Payment Required","403":"Forbidden","404":"Not Found","405":"Method Not Allowed","406":"Not Acceptable","407":"Proxy Authentication Required","408":"Request Timeout","409":"Conflict","410":"Gone","411":"Length Required","412":"Precondition Failed","413":"Payload Too Large","414":"URI Too Long","415":"Unsupported Media Type","416":"Range Not Satisfiable","417":"Expectation Failed","418":"I\'m a teapot","421":"Misdirected Request","422":"Unprocessable Entity","423":"Locked","424":"Failed Dependency","425":"Unordered Collection","426":"Upgrade Required","428":"Precondition Required","429":"Too Many Requests","431":"Request Header Fields Too Large","451":"Unavailable For Legal Reasons","500":"Internal Server Error","501":"Not Implemented","502":"Bad Gateway","503":"Service Unavailable","504":"Gateway Timeout","505":"HTTP Version Not Supported","506":"Variant Also Negotiates","507":"Insufficient Storage","508":"Loop Detected","509":"Bandwidth Limit Exceeded","510":"Not Extended","511":"Network Authentication Required"}',
        );
      },
    },
    __webpack_module_cache__ = {};

  function __webpack_require__(t) {
    var e = __webpack_module_cache__[t];
    if (void 0 !== e) return e.exports;
    var r = (__webpack_module_cache__[t] = {
      id: t,
      loaded: !1,
      exports: {},
    });
    return (
      __webpack_modules__[t].call(r.exports, r, r.exports, __webpack_require__),
      (r.loaded = !0),
      r.exports
    );
  }
  (__webpack_require__.amdO = {}),
    (__webpack_require__.n = (t) => {
      var e = t && t.__esModule ? () => t.default : () => t;
      return (
        __webpack_require__.d(e, {
          a: e,
        }),
        e
      );
    }),
    (__webpack_require__.d = (t, e) => {
      for (var r in e)
        __webpack_require__.o(e, r) &&
          !__webpack_require__.o(t, r) &&
          Object.defineProperty(t, r, {
            enumerable: !0,
            get: e[r],
          });
    }),
    (__webpack_require__.g = (function () {
      if ("object" == typeof globalThis) return globalThis;
      try {
        return this || new Function("return this")();
      } catch (t) {
        if ("object" == typeof window) return window;
      }
    })()),
    (__webpack_require__.o = (t, e) => Object.prototype.hasOwnProperty.call(t, e)),
    (__webpack_require__.nmd = (t) => ((t.paths = []), t.children || (t.children = []), t));
  var __webpack_exports__ = {};
  (() => {
    var t = __webpack_require__(84322),
      e = __webpack_require__.n(t);

    function r(t, e, r, n, i, o, s) {
      try {
        var a = t[o](s),
          c = a.value;
      } catch (t) {
        return void r(t);
      }
      a.done ? e(c) : Promise.resolve(c).then(n, i);
    }

    function n(t) {
      return function () {
        var e = this,
          n = arguments;
        return new Promise(function (i, o) {
          var s = t.apply(e, n);

          function a(t) {
            r(s, i, o, a, c, "next", t);
          }

          function c(t) {
            r(s, i, o, a, c, "throw", t);
          }
          a(void 0);
        });
      };
    }

    function i(t, e, r) {
      return (
        e in t
          ? Object.defineProperty(t, e, {
              value: r,
              enumerable: !0,
              configurable: !0,
              writable: !0,
            })
          : (t[e] = r),
        t
      );
    }

    function o(t, e) {
      var r = Object.keys(t);
      if (Object.getOwnPropertySymbols) {
        var n = Object.getOwnPropertySymbols(t);
        e &&
          (n = n.filter(function (e) {
            return Object.getOwnPropertyDescriptor(t, e).enumerable;
          })),
          r.push.apply(r, n);
      }
      return r;
    }

    function s(t) {
      for (var e = 1; e < arguments.length; e++) {
        var r = null != arguments[e] ? arguments[e] : {};
        e % 2
          ? o(Object(r), !0).forEach(function (e) {
              i(t, e, r[e]);
            })
          : Object.getOwnPropertyDescriptors
            ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(r))
            : o(Object(r)).forEach(function (e) {
                Object.defineProperty(t, e, Object.getOwnPropertyDescriptor(r, e));
              });
      }
      return t;
    }
    var a = __webpack_require__(68447),
      c = {},
      u = {
        accountId: "",
        accessKey: null,
        allKeys: {},
      };
    var h = function () {
        return 1e3 * Date.now() + ((t = 1e3), Math.floor(Math.random() * t));
        var t;
      },
      l = {
        error: "Please sign in first",
      },
      f = function (t) {
        return new Promise(function (e, r) {
          var n = h();
          (c[n] = e),
            window.postMessage(
              s(
                s({}, t),
                {},
                {
                  notificationId: n,
                },
              ),
            );
        });
      },
      d = (function () {
        var t = n(
          e().mark(function t(r) {
            var n, i, o, c, u, h, l, f, d, p, y;
            return e().wrap(function (t) {
              for (;;)
                switch ((t.prev = t.next)) {
                  case 0:
                    if (
                      ((n = r.accountId),
                      (i = r.allKeys),
                      (o = r.accessKey),
                      (c = r.rpc),
                      (window.near.accountId = n),
                      !o)
                    ) {
                      t.next = 18;
                      break;
                    }
                    return (
                      (u = o.secretKey),
                      (h = a.KeyPair.fromString(u)),
                      (l = new a.keyStores.InMemoryKeyStore()),
                      (t.next = 8),
                      l.setKey(c.networkId, n, h)
                    );
                  case 8:
                    return (
                      (t.next = 10),
                      a.connect(
                        s(
                          s({}, c),
                          {},
                          {
                            keyStore: l,
                          },
                        ),
                      )
                    );
                  case 10:
                    return (f = t.sent), (t.next = 13), f.account(n);
                  case 13:
                    (d = t.sent),
                      (window.near.__account = d),
                      (window.near.authData = {
                        accountId: n,
                        allKeys: s(s({}, window.near.authData.allKeys), i),
                        accessKey: o,
                      }),
                      (t.next = 22);
                    break;
                  case 18:
                    (p = a.Connection.fromConfig({
                      networkId: c.networkId,
                      provider: {
                        type: "JsonRpcProvider",
                        args: {
                          url: c.nodeUrl + "/",
                        },
                      },
                      signer: {},
                    })),
                      (y = new a.Account(p, n || "dontcare")),
                      (window.near.__account = y),
                      (window.near.authData = {
                        accountId: n,
                        allKeys: {},
                        accessKey: null,
                      });
                  case 22:
                  case "end":
                    return t.stop();
                }
            }, t);
          }),
        );
        return function (e) {
          return t.apply(this, arguments);
        };
      })(),
      p = (function () {
        var t = n(
          e().mark(function t() {
            var r,
              n,
              i,
              o,
              s,
              a,
              c,
              h,
              l = arguments;
            return e().wrap(function (t) {
              for (;;)
                switch ((t.prev = t.next)) {
                  case 0:
                    (i = l.length > 0 && void 0 !== l[0] ? l[0] : {}),
                      (o = i.contractId),
                      (s = i.methodNames),
                      (a =
                        (null === (r = window.near) ||
                        void 0 === r ||
                        null === (n = r.authData) ||
                        void 0 === n
                          ? void 0
                          : n.allKeys) || {}) &&
                        a[o] &&
                        ((c = a[o].filter(function (t) {
                          return "".concat(t.methodNames) !== "".concat(s || null);
                        })),
                        (a[o] = c),
                        0 === a[o].length && delete a[o]),
                      (window.near.authData.allKeys = a),
                      0 === (h = Object.keys(a)).length
                        ? ((window.near.authData = u),
                          (window.near.accountId = ""),
                          (window.near.__account = null))
                        : a[h[0]] &&
                          a[h[0]].length > 0 &&
                          (window.near.authData.accessKey = a[h[0]][0].accessKey),
                      window.near.callbacks.signOut && window.near.callbacks.signOut(!0);
                  case 8:
                  case "end":
                    return t.stop();
                }
            }, t);
          }),
        );
        return function () {
          return t.apply(this, arguments);
        };
      })(),
      y = function () {
        window.near &&
          ((window.near.authData = u),
          (window.near.accountId = ""),
          (window.near.__account = null));
      };
    (window.near = new (function t() {
      var r = this;
      !(function (t, e) {
        if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function");
      })(this, t),
        (this.on = function (t, e) {
          r.callbacks[t] = e;
        }),
        (this.remove = function (t) {
          r.callbacks[t] = null;
        }),
        (this.getAccountId = function () {
          return r.accountId;
        }),
        (this.isSignedIn = function () {
          var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
            e = t || {},
            n = e.contractId,
            i = e.methodNames;
          if (!n) return !!r.authData.accountId;
          if (r.authData.allKeys && r.authData.allKeys[n]) {
            var o = !1,
              s = r.authData.allKeys[n];
            return (
              s.forEach(function (t) {
                "".concat(t.methodNames) === "".concat(i || null) && (o = !!t.accessKey);
              }),
              o
            );
          }
          return !1;
        }),
        (this.account = function () {
          return r.__account;
        }),
        (this.requestSignIn = function (t) {
          var e = t.contractId,
            n = t.methodNames,
            i = t.amount,
            o = t.createNew;
          return r.request({
            method: "signin",
            params: {
              contractId: e,
              methodNames: n,
              amount: i,
              createNew: o,
            },
          });
        }),
        (this.signOut = function () {
          var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
            e = t.contractId,
            n = t.methodNames;
          return r.disconnect({
            contractId: e,
            methodNames: n,
          });
        }),
        (this.disconnect = function () {
          var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
            e = t.contractId,
            n = t.methodNames;
          return r.request({
            method: "signout",
            params: {
              contractId: e,
              methodNames: n,
            },
          });
        }),
        (this.request = (function () {
          var t = n(
            e().mark(function t(n) {
              var i, o, s, a, c;
              return e().wrap(function (t) {
                for (;;)
                  switch ((t.prev = t.next)) {
                    case 0:
                      if (
                        ((i = n.method),
                        (o = n.params),
                        (s = void 0 === o ? {} : o),
                        ("signAndSendTransactions" !== i && "sendMoney" !== i) || r.accountId)
                      ) {
                        t.next = 3;
                        break;
                      }
                      return t.abrupt("return", l);
                    case 3:
                      return (
                        (a = {
                          type: "sender-wallet-fromPage",
                          method: i,
                          params: s,
                        }),
                        (t.next = 6),
                        f(a)
                      );
                    case 6:
                      if (!(c = t.sent).isUnlock) {
                        t.next = 11;
                        break;
                      }
                      return (t.next = 10), f(a);
                    case 10:
                      c = t.sent;
                    case 11:
                      return t.abrupt("return", c);
                    case 12:
                    case "end":
                      return t.stop();
                  }
              }, t);
            }),
          );
          return function (e) {
            return t.apply(this, arguments);
          };
        })()),
        (this.signAndSendTransaction = function (t) {
          var e = t.receiverId,
            n = t.actions;
          return r.request({
            method: "signAndSendTransactions",
            params: {
              transactions: [
                {
                  receiverId: e,
                  actions: n,
                },
              ],
            },
          });
        }),
        (this.requestSignTransactions = function (t) {
          var e = t.transactions;
          return r.request({
            method: "signAndSendTransactions",
            params: {
              transactions: e,
            },
          });
        }),
        (this.sendMoney = function (t) {
          var e = t.receiverId,
            n = t.amount;
          return r.request({
            method: "sendMoney",
            params: {
              receiverId: e,
              amount: n,
            },
          });
        }),
        (this.accountId = ""),
        (this.authData = u),
        (this.isSender = !0),
        (this.callbacks = {}),
        (this.__account = null);
    })()),
      window.near.request({
        method: "persisSignInStatus",
        params: {},
      }),
      window.addEventListener("message", function (t) {
        try {
          var e = t.data;
          if ("sender-wallet-fromContent" === e.type) {
            var r = e.eventName;
            if (window.near.callbacks[r])
              switch (r) {
                case "accountChanged":
                  y(),
                    window.near.request({
                      method: "persisSignInStatus",
                      params: {},
                    }),
                    window.near.callbacks.accountChanged &&
                      window.near.callbacks.accountChanged(e.accountId);
                  break;
                case "rpcChanged":
                  y(),
                    window.near.request({
                      method: "persisSignInStatus",
                      params: {},
                    }),
                    window.near.callbacks.rpcChanged && window.near.callbacks.rpcChanged(e.rpc);
                  break;
                default:
                  window.near.callbacks[r] && window.near.callbacks[r](e);
              }
          }
          if (
            "sender-wallet-extensionResult" === e.type ||
            "sender-wallet-providerResult" === e.type
          )
            if ("disconnect" === e.method || "signout" === e.method) {
              var n = e.response,
                i = e.notificationId;
              if (n.error)
                c[i]({
                  error: n.error,
                });
              else {
                var o = n.contractId,
                  s = n.methodNames;
                c[i](!0),
                  p({
                    contractId: o,
                    methodNames: s,
                  });
              }
            } else if ("signin" === e.method || "persisSignInStatus" === e.method) {
              var a = e.accountId,
                u = e.contractId,
                h = e.response,
                l = e.allKeys,
                f = e.rpc,
                m = e.network,
                g = e.notificationId;
              if (h.error)
                c[g]({
                  error: h.error,
                });
              else {
                var w = {};
                h &&
                  h.accountId &&
                  ((w = h.accessKey),
                  (a = h.accountId),
                  (u = h.contractId),
                  (f = h.rpc),
                  (m = h.network),
                  (l = h.allKeys)),
                  d({
                    accountId: a,
                    allKeys: l,
                    accessKey: w,
                    network: m,
                    rpc: f,
                  }),
                  c[g]({
                    accessKey: w,
                  }),
                  window.near.callbacks.signIn &&
                    window.near.callbacks.signIn({
                      accountId: a,
                      accessKey: w,
                      contractId: u,
                      network: m,
                      rpc: f,
                    });
              }
            } else
              "unlock" === e.method && "success" === e.response
                ? c[e.notificationId]({
                    isUnlock: !0,
                  })
                : c[e.notificationId](e);
        } catch (t) {}
      });
  })();
})();
