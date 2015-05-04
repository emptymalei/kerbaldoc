// Generated by CoffeeScript 1.6.2
(function() {
  var HALF_PI, MACHINE_EPSILON, TWO_PI, acot, acoth, brentsMethod, relativeError;

  TWO_PI = 2 * Math.PI;

  HALF_PI = 0.5 * Math.PI;

  MACHINE_EPSILON = roots.MACHINE_EPSILON;

  acot = function(x) {
    return HALF_PI - Math.atan(x);
  };

  acoth = function(x) {
    return 0.5 * Math.log((x + 1) / (x - 1));
  };

  relativeError = function(a, b) {
    return Math.abs(1.0 - a / b);
  };

  brentsMethod = roots.brentsMethod;

  this.lambert = function(mu, pos1, pos2, dt, maxRevs, prograde) {
    var N, angleParameter, c, deltaPos, ftau, fy, invSqrtM, invSqrtN, m, minimumEnergyNormalizedTime, minimumNormalizedTime, n, normalizedTime, parabolicNormalizedTime, phix, phiy, pushSolution, r1, r2, solutions, sqrtMu, transferAngle, x, x1, x2, xMT, y, _i;

    if (maxRevs == null) {
      maxRevs = 0;
    }
    if (prograde == null) {
      prograde = 1;
    }
    r1 = numeric.norm2(pos1);
    r2 = numeric.norm2(pos2);
    deltaPos = numeric.subVV(pos2, pos1);
    c = numeric.norm2(deltaPos);
    m = r1 + r2 + c;
    n = r1 + r2 - c;
    transferAngle = Math.acos(numeric.dotVV(pos1, pos2) / (r1 * r2));
    if ((pos1[0] * pos2[1] - pos1[1] * pos2[0]) * prograde < 0) {
      transferAngle = TWO_PI - transferAngle;
    }
    angleParameter = Math.sqrt(n / m);
    if (transferAngle > Math.PI) {
      angleParameter = -angleParameter;
    }
    normalizedTime = 4 * dt * Math.sqrt(mu / (m * m * m));
    parabolicNormalizedTime = 2 / 3 * (1 - angleParameter * angleParameter * angleParameter);
    sqrtMu = Math.sqrt(mu);
    invSqrtM = 1 / Math.sqrt(m);
    invSqrtN = 1 / Math.sqrt(n);
    solutions = [];
    pushSolution = function(x, y, N) {
      var ec, v1, v2, vc, vr;

      vc = sqrtMu * (y * invSqrtN + x * invSqrtM);
      vr = sqrtMu * (y * invSqrtN - x * invSqrtM);
      ec = numeric.mulVS(deltaPos, vc / c);
      v1 = numeric.addVV(ec, numeric.mulVS(pos1, vr / r1));
      v2 = numeric.subVV(ec, numeric.mulVS(pos2, vr / r2));
      return solutions.push([v1, v2, N * TWO_PI + transferAngle]);
    };
    fy = function(x) {
      var y;

      y = Math.sqrt(1 - angleParameter * angleParameter * (1 - x * x));
      if (angleParameter < 0) {
        return -y;
      } else {
        return y;
      }
    };
    ftau = function(x) {
      var g, h, y;

      if (x === 1.0) {
        return parabolicNormalizedTime - normalizedTime;
      } else {
        y = fy(x);
        if (x > 1) {
          g = Math.sqrt(x * x - 1);
          h = Math.sqrt(y * y - 1);
          return (-acoth(x / g) + acoth(y / h) + x * g - y * h) / (g * g * g) - normalizedTime;
        } else {
          g = Math.sqrt(1 - x * x);
          h = Math.sqrt(1 - y * y);
          return (acot(x / g) - Math.atan(h / y) - x * g + y * h + N * Math.PI) / (g * g * g) - normalizedTime;
        }
      }
    };
    if (relativeError(normalizedTime, parabolicNormalizedTime) < 1e-6) {
      x = 1.0;
      y = angleParameter < 0 ? -1 : 1;
      pushSolution(x, y, 0);
    } else if (normalizedTime < parabolicNormalizedTime) {
      x1 = 1.0;
      x2 = 2.0;
      while (!(ftau(x2) < 0.0)) {
        x1 = x2;
        x2 *= 2.0;
      }
      x = brentsMethod(x1, x2, 1e-4, ftau);
      pushSolution(x, fy(x), N);
    } else {
      maxRevs = Math.min(maxRevs, Math.floor(normalizedTime / Math.PI));
      minimumEnergyNormalizedTime = Math.acos(angleParameter) + angleParameter * Math.sqrt(1 - angleParameter * angleParameter);
      for (N = _i = 0; 0 <= maxRevs ? _i <= maxRevs : _i >= maxRevs; N = 0 <= maxRevs ? ++_i : --_i) {
        if (N > 0 && N === maxRevs) {
          phix = function(x) {
            var g;

            g = Math.sqrt(1 - x * x);
            return acot(x / g) - (2 + x * x) * g / (3 * x);
          };
          phiy = function(y) {
            var h;

            h = Math.sqrt(1 - y * y);
            return Math.atan(h / y) - (2 + y * y) * h / (3 * y);
          };
          if (angleParameter === 1) {
            xMT = 0;
            minimumNormalizedTime = minimumEnergyNormalizedTime;
          } else if (angleParameter === 0) {
            xMT = brentsMethod(0, 1, 1e-6, function(x) {
              return phix(x) + N * Math.PI;
            });
            minimumNormalizedTime = 2 / (3 * xMT);
          } else {
            xMT = brentsMethod(0, 1, 1e-6, function(x) {
              return phix(x) - phiy(fy(x)) + N * Math.PI;
            });
            minimumNormalizedTime = 2 / 3 * (1 / xMT - angleParameter * angleParameter * angleParameter / Math.abs(fy(xMT)));
          }
          if (relativeError(normalizedTime, minimumNormalizedTime) < 1e-6) {
            pushSolution(xMT, fy(xMT), (N + 1) * TWO_PI - transferAngle);
            break;
          } else if (normalizedTime < minimumNormalizedTime) {
            break;
          } else if (normalizedTime < minimumEnergyNormalizedTime) {
            x = brentsMethod(0, xMT, 1e-4, ftau);
            if (!isNaN(x)) {
              pushSolution(x, fy(x), N);
            }
            x = brentsMethod(xMT, 1.0 - MACHINE_EPSILON, 1e-4, ftau);
            if (!isNaN(x)) {
              pushSolution(x, fy(x), N);
            }
            break;
          }
        }
        if (relativeError(normalizedTime, minimumEnergyNormalizedTime) < 1e-6) {
          pushSolution(0, fy(0), N);
          if (N > 0) {
            x = brentsMethod(1e-6, 1.0 - MACHINE_EPSILON, 1e-4, ftau);
            if (!isNaN(x)) {
              pushSolution(x, fy(x), N);
            }
          }
        } else {
          if (N > 0 || normalizedTime > minimumEnergyNormalizedTime) {
            x = brentsMethod(-1.0 + MACHINE_EPSILON, 0, 1e-4, ftau);
            if (!isNaN(x)) {
              pushSolution(x, fy(x), N);
            }
          }
          if (N > 0 || normalizedTime < minimumEnergyNormalizedTime) {
            x = brentsMethod(0, 1.0 - MACHINE_EPSILON, 1e-4, ftau);
            if (!isNaN(x)) {
              pushSolution(x, fy(x), N);
            }
          }
        }
        minimumEnergyNormalizedTime += Math.PI;
      }
    }
    return solutions;
  };

}).call(this);
