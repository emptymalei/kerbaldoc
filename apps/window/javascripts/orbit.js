// Generated by CoffeeScript 1.6.2
(function() {
  var HALF_PI, Orbit, TWO_PI, acosh, angleInPlane, brentsMethod, circularToEscapeDeltaV, cosh, crossProduct, ejectionAngle, goldenSectionSearch, insertionToCircularDeltaV, newtonsMethod, normalize, projectToPlane, sign, sinh;

  TWO_PI = 2 * Math.PI;

  HALF_PI = 0.5 * Math.PI;

  sign = function(x) {
    if (typeof x === 'number') {
      if (x) {
        if (x < 0) {
          return -1;
        } else {
          return 1;
        }
      } else {
        if (x === x) {
          return 0;
        } else {
          return NaN;
        }
      }
    } else {
      return NaN;
    }
  };

  sinh = function(angle) {
    var p;

    p = Math.exp(angle);
    return (p - (1 / p)) * 0.5;
  };

  cosh = function(angle) {
    var p;

    p = Math.exp(angle);
    return (p + (1 / p)) * 0.5;
  };

  acosh = function(n) {
    return Math.log(n + Math.sqrt(n * n - 1));
  };

  crossProduct = function(a, b) {
    var r;

    r = new Array(3);
    r[0] = a[1] * b[2] - a[2] * b[1];
    r[1] = a[2] * b[0] - a[0] * b[2];
    r[2] = a[0] * b[1] - a[1] * b[0];
    return r;
  };

  normalize = function(v) {
    return numeric.divVS(v, numeric.norm2(v));
  };

  projectToPlane = function(p, n) {
    return numeric.subVV(p, numeric.mulSV(numeric.dotVV(p, n), n));
  };

  angleInPlane = function(from, to, normal) {
    var result, rot;

    from = normalize(projectToPlane(from, normal));
    to = normalize(projectToPlane(to, normal));
    rot = quaternion.fromToRotation(normal, [0, 0, 1]);
    from = quaternion.rotate(rot, from);
    to = quaternion.rotate(rot, to);
    result = Math.atan2(from[1], from[0]) - Math.atan2(to[1], to[0]);
    if (result < 0) {
      return result + TWO_PI;
    } else {
      return result;
    }
  };

  newtonsMethod = roots.newtonsMethod;

  brentsMethod = roots.brentsMethod;

  goldenSectionSearch = roots.goldenSectionSearch;

  (typeof exports !== "undefined" && exports !== null ? exports : this).Orbit = Orbit = (function() {
    function Orbit(referenceBody, semiMajorAxis, eccentricity, inclination, longitudeOfAscendingNode, argumentOfPeriapsis, meanAnomalyAtEpoch, timeOfPeriapsisPassage) {
      this.referenceBody = referenceBody;
      this.semiMajorAxis = semiMajorAxis;
      this.eccentricity = eccentricity;
      this.meanAnomalyAtEpoch = meanAnomalyAtEpoch;
      this.timeOfPeriapsisPassage = timeOfPeriapsisPassage;
      if (inclination != null) {
        this.inclination = inclination * Math.PI / 180;
      }
      if (longitudeOfAscendingNode != null) {
        this.longitudeOfAscendingNode = longitudeOfAscendingNode * Math.PI / 180;
      }
      if (argumentOfPeriapsis != null) {
        this.argumentOfPeriapsis = argumentOfPeriapsis * Math.PI / 180;
      }
    }

    Orbit.prototype.isHyperbolic = function() {
      return this.eccentricity > 1;
    };

    Orbit.prototype.apoapsis = function() {
      return this.semiMajorAxis * (1 + this.eccentricity);
    };

    Orbit.prototype.periapsis = function() {
      return this.semiMajorAxis * (1 - this.eccentricity);
    };

    Orbit.prototype.apoapsisAltitude = function() {
      return this.apoapsis() - this.referenceBody.radius;
    };

    Orbit.prototype.periapsisAltitude = function() {
      return this.periapsis() - this.referenceBody.radius;
    };

    Orbit.prototype.semiMinorAxis = function() {
      var e;

      e = this.eccentricity;
      return this.semiMajorAxis * Math.sqrt(1 - e * e);
    };

    Orbit.prototype.semiLatusRectum = function() {
      var e;

      e = this.eccentricity;
      return this.semiMajorAxis * (1 - e * e);
    };

    Orbit.prototype.meanMotion = function() {
      var a;

      a = Math.abs(this.semiMajorAxis);
      return Math.sqrt(this.referenceBody.gravitationalParameter / (a * a * a));
    };

    Orbit.prototype.period = function() {
      if (this.isHyperbolic()) {
        return Infinity;
      } else {
        return TWO_PI / this.meanMotion();
      }
    };

    Orbit.prototype.rotationToReferenceFrame = function() {
      var axisOfInclination;

      axisOfInclination = [Math.cos(-this.argumentOfPeriapsis), Math.sin(-this.argumentOfPeriapsis), 0];
      return quaternion.concat(quaternion.fromAngleAxis(this.longitudeOfAscendingNode + this.argumentOfPeriapsis, [0, 0, 1]), quaternion.fromAngleAxis(this.inclination, axisOfInclination));
    };

    Orbit.prototype.normalVector = function() {
      return quaternion.rotate(this.rotationToReferenceFrame(), [0, 0, 1]);
    };

    Orbit.prototype.phaseAngle = function(orbit, t) {
      var n, p1, p2, phaseAngle, r1, r2;

      n = this.normalVector();
      p1 = this.positionAtTrueAnomaly(this.trueAnomalyAt(t));
      p2 = orbit.positionAtTrueAnomaly(orbit.trueAnomalyAt(t));
      p2 = numeric.subVV(p2, numeric.mulVS(n, numeric.dotVV(p2, n)));
      r1 = numeric.norm2(p1);
      r2 = numeric.norm2(p2);
      phaseAngle = Math.acos(numeric.dotVV(p1, p2) / (r1 * r2));
      if (numeric.dotVV(crossProduct(p1, p2), n) < 0) {
        phaseAngle = TWO_PI - phaseAngle;
      }
      if (orbit.semiMajorAxis < this.semiMajorAxis) {
        phaseAngle = phaseAngle - TWO_PI;
      }
      return phaseAngle;
    };

    Orbit.prototype.meanAnomalyAt = function(t) {
      var M;

      if (this.isHyperbolic()) {
        return (t - this.timeOfPeriapsisPassage) * this.meanMotion();
      } else {
        if (this.timeOfPeriapsisPassage != null) {
          M = ((t - this.timeOfPeriapsisPassage) % this.period()) * this.meanMotion();
          if (M < 0) {
            return M + TWO_PI;
          } else {
            return M;
          }
        } else {
          return (this.meanAnomalyAtEpoch + this.meanMotion() * (t % this.period())) % TWO_PI;
        }
      }
    };

    Orbit.prototype.eccentricAnomalyAt = function(t) {
      var M, e;

      e = this.eccentricity;
      M = this.meanAnomalyAt(t);
      if (this.isHyperbolic()) {
        return newtonsMethod(M, function(x) {
          return M - e * sinh(x) + x;
        }, function(x) {
          return 1 - e * cosh(x);
        });
      } else {
        return newtonsMethod(M, function(x) {
          return M + e * Math.sin(x) - x;
        }, function(x) {
          return e * Math.cos(x) - 1;
        });
      }
    };

    Orbit.prototype.trueAnomalyAt = function(t) {
      var E, H, e, tA;

      e = this.eccentricity;
      if (this.isHyperbolic()) {
        H = this.eccentricAnomalyAt(t);
        tA = Math.acos((e - cosh(H)) / (cosh(H) * e - 1));
        if (H < 0) {
          return -tA;
        } else {
          return tA;
        }
      } else {
        E = this.eccentricAnomalyAt(t);
        tA = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
        if (tA < 0) {
          return tA + TWO_PI;
        } else {
          return tA;
        }
      }
    };

    Orbit.prototype.eccentricAnomalyAtTrueAnomaly = function(tA) {
      var E, H, cosTrueAnomaly, e;

      e = this.eccentricity;
      if (this.isHyperbolic()) {
        cosTrueAnomaly = Math.cos(tA);
        H = acosh((e + cosTrueAnomaly) / (1 + e * cosTrueAnomaly));
        if (tA < 0) {
          return -H;
        } else {
          return H;
        }
      } else {
        E = 2 * Math.atan(Math.tan(tA / 2) / Math.sqrt((1 + e) / (1 - e)));
        if (E < 0) {
          return E + TWO_PI;
        } else {
          return E;
        }
      }
    };

    Orbit.prototype.meanAnomalyAtTrueAnomaly = function(tA) {
      var E, H, e;

      e = this.eccentricity;
      if (this.isHyperbolic()) {
        H = this.eccentricAnomalyAtTrueAnomaly(tA);
        return e * sinh(H) - H;
      } else {
        E = this.eccentricAnomalyAtTrueAnomaly(tA);
        return E - e * Math.sin(E);
      }
    };

    Orbit.prototype.timeAtTrueAnomaly = function(tA, t0) {
      var M, p, t;

      if (t0 == null) {
        t0 = 0;
      }
      M = this.meanAnomalyAtTrueAnomaly(tA);
      if (this.isHyperbolic()) {
        return this.timeOfPeriapsisPassage + M / this.meanMotion();
      } else {
        p = this.period();
        if (this.timeOfPeriapsisPassage != null) {
          t = this.timeOfPeriapsisPassage + p * Math.floor((t0 - this.timeOfPeriapsisPassage) / p) + M / this.meanMotion();
        } else {
          t = (t0 - (t0 % p)) + (M - this.meanAnomalyAtEpoch) / this.meanMotion();
        }
        if (t < t0) {
          return t + p;
        } else {
          return t;
        }
      }
    };

    Orbit.prototype.radiusAtTrueAnomaly = function(tA) {
      var e;

      e = this.eccentricity;
      return this.semiMajorAxis * (1 - e * e) / (1 + e * Math.cos(tA));
    };

    Orbit.prototype.altitudeAtTrueAnomaly = function(tA) {
      return this.radiusAtTrueAnomaly(tA) - this.referenceBody.radius;
    };

    Orbit.prototype.speedAtTrueAnomaly = function(tA) {
      return Math.sqrt(this.referenceBody.gravitationalParameter * (2 / this.radiusAtTrueAnomaly(tA) - 1 / this.semiMajorAxis));
    };

    Orbit.prototype.positionAtTrueAnomaly = function(tA) {
      var r;

      r = this.radiusAtTrueAnomaly(tA);
      return quaternion.rotate(this.rotationToReferenceFrame(), [r * Math.cos(tA), r * Math.sin(tA), 0]);
    };

    Orbit.prototype.velocityAtTrueAnomaly = function(tA) {
      var cos, e, h, mu, r, sin, vr, vtA;

      mu = this.referenceBody.gravitationalParameter;
      e = this.eccentricity;
      h = Math.sqrt(mu * this.semiMajorAxis * (1 - e * e));
      r = this.radiusAtTrueAnomaly(tA);
      sin = Math.sin(tA);
      cos = Math.cos(tA);
      vr = mu * e * sin / h;
      vtA = h / r;
      return quaternion.rotate(this.rotationToReferenceFrame(), [vr * cos - vtA * sin, vr * sin + vtA * cos, 0]);
    };

    Orbit.prototype.trueAnomalyAtPosition = function(p) {
      p = quaternion.rotate(quaternion.conjugate(this.rotationToReferenceFrame()), p);
      return Math.atan2(p[1], p[0]);
    };

    return Orbit;

  })();

  Orbit.fromJSON = function(json) {
    var referenceBody, result;

    referenceBody = CelestialBody.fromJSON(json.referenceBody);
    result = new Orbit(referenceBody, json.semiMajorAxis, json.eccentricity);
    result.inclination = json.inclination;
    result.longitudeOfAscendingNode = json.longitudeOfAscendingNode;
    result.argumentOfPeriapsis = json.argumentOfPeriapsis;
    result.meanAnomalyAtEpoch = json.meanAnomalyAtEpoch;
    result.timeOfPeriapsisPassage = json.timeOfPeriapsisPassage;
    return result;
  };

  Orbit.fromApoapsisAndPeriapsis = function(referenceBody, apoapsis, periapsis, inclination, longitudeOfAscendingNode, argumentOfPeriapsis, meanAnomalyAtEpoch, timeOfPeriapsisPassage) {
    var eccentricity, semiMajorAxis, _ref;

    if (apoapsis < periapsis) {
      _ref = [periapsis, apoapsis], apoapsis = _ref[0], periapsis = _ref[1];
    }
    semiMajorAxis = (apoapsis + periapsis) / 2;
    eccentricity = apoapsis / semiMajorAxis - 1;
    return new Orbit(referenceBody, semiMajorAxis, eccentricity, inclination, longitudeOfAscendingNode, argumentOfPeriapsis, meanAnomalyAtEpoch, timeOfPeriapsisPassage);
  };

  Orbit.fromPositionAndVelocity = function(referenceBody, position, velocity, t) {
    var eccentricity, eccentricityVector, meanAnomaly, mu, nodeVector, orbit, r, semiMajorAxis, specificAngularMomentum, trueAnomaly, v;

    mu = referenceBody.gravitationalParameter;
    r = numeric.norm2(position);
    v = numeric.norm2(velocity);
    specificAngularMomentum = crossProduct(position, velocity);
    if (specificAngularMomentum[0] !== 0 || specificAngularMomentum[1] !== 0) {
      nodeVector = normalize([-specificAngularMomentum[1], specificAngularMomentum[0], 0]);
    } else {
      nodeVector = [1, 0, 0];
    }
    eccentricityVector = numeric.mulSV(1 / mu, numeric.subVV(numeric.mulSV(v * v - mu / r, position), numeric.mulSV(numeric.dotVV(position, velocity), velocity)));
    semiMajorAxis = 1 / (2 / r - v * v / mu);
    eccentricity = numeric.norm2(eccentricityVector);
    orbit = new Orbit(referenceBody, semiMajorAxis, eccentricity);
    orbit.inclination = Math.acos(specificAngularMomentum[2] / numeric.norm2(specificAngularMomentum));
    if (eccentricity === 0) {
      orbit.argumentOfPeriapsis = 0;
      orbit.longitudeOfAscendingNode = 0;
    } else {
      orbit.longitudeOfAscendingNode = Math.acos(nodeVector[0]);
      if (nodeVector[1] < 0) {
        orbit.longitudeOfAscendingNode = TWO_PI - orbit.longitudeOfAscendingNode;
      }
      orbit.argumentOfPeriapsis = Math.acos(numeric.dotVV(nodeVector, eccentricityVector) / eccentricity);
      if (eccentricityVector[2] < 0) {
        orbit.argumentOfPeriapsis = TWO_PI - orbit.argumentOfPeriapsis;
      }
    }
    trueAnomaly = Math.acos(numeric.dotVV(eccentricityVector, position) / (eccentricity * r));
    if (numeric.dotVV(position, velocity) < 0) {
      trueAnomaly = -trueAnomaly;
    }
    meanAnomaly = orbit.meanAnomalyAtTrueAnomaly(trueAnomaly);
    orbit.timeOfPeriapsisPassage = t - meanAnomaly / orbit.meanMotion();
    return orbit;
  };

  circularToEscapeDeltaV = function(body, v0, vsoi, relativeInclination) {
    var ap, e, mu, r0, rsoi, v1;

    mu = body.gravitationalParameter;
    rsoi = body.sphereOfInfluence;
    v1 = Math.sqrt(vsoi * vsoi + 2 * v0 * v0 - 2 * mu / rsoi);
    r0 = mu / (v0 * v0);
    e = r0 * v1 * v1 / mu - 1;
    ap = r0 * (1 + e) / (1 - e);
    if (ap > 0 && ap <= rsoi) {
      return NaN;
    }
    if (relativeInclination) {
      return Math.sqrt(v0 * v0 + v1 * v1 - 2 * v0 * v1 * Math.cos(relativeInclination));
    } else {
      return v1 - v0;
    }
  };

  insertionToCircularDeltaV = function(body, vsoi, v0) {
    var mu, rsoi;

    mu = body.gravitationalParameter;
    rsoi = body.sphereOfInfluence;
    return Math.sqrt(vsoi * vsoi + 2 * v0 * v0 - 2 * mu / rsoi) - v0;
  };

  ejectionAngle = function(vsoi, theta, prograde) {
    var a, ax, ay, az, b, c, cosTheta, g, q, vx, vy, _ref;

    _ref = normalize(vsoi), ax = _ref[0], ay = _ref[1], az = _ref[2];
    cosTheta = Math.cos(theta);
    g = -ax / ay;
    a = 1 + g * g;
    b = 2 * g * cosTheta / ay;
    c = cosTheta * cosTheta / (ay * ay) - 1;
    if (b < 0) {
      q = -0.5 * (b - Math.sqrt(b * b - 4 * a * c));
    } else {
      q = -0.5 * (b + Math.sqrt(b * b - 4 * a * c));
    }
    vx = q / a;
    vy = g * vx + cosTheta / ay;
    if (sign(crossProduct([vx, vy, 0], [ax, ay, az])[2]) !== sign(Math.PI - theta)) {
      vx = c / q;
      vy = g * vx + cosTheta / ay;
    }
    prograde = [prograde[0], prograde[1], 0];
    if (crossProduct([vx, vy, 0], prograde)[2] < 0) {
      return TWO_PI - Math.acos(numeric.dotVV([vx, vy, 0], prograde));
    } else {
      return Math.acos(numeric.dotVV([vx, vy, 0], prograde));
    }
  };

  Orbit.transfer = function(transferType, originBody, destinationBody, t0, dt, initialOrbitalVelocity, finalOrbitalVelocity, p0, v0, n0, p1, v1, planeChangeAngleToIntercept) {
    var ballisticTransfer, dv, ejectionDeltaV, ejectionDeltaVector, ejectionInclination, ejectionVelocity, insertionDeltaV, insertionDeltaVector, insertionInclination, insertionVelocity, minDeltaV, nu0, nu1, orbit, p1InOriginPlane, planeChangeAngle, planeChangeAxis, planeChangeDeltaV, planeChangeRotation, planeChangeTime, planeChangeTransfer, planeChangeTrueAnomaly, referenceBody, relativeInclination, s, solutions, t1, transferAngle, trueAnomalyAtIntercept, v1InOriginPlane, x, x1, x2, _i, _len, _ref;

    referenceBody = originBody.orbit.referenceBody;
    t1 = t0 + dt;
    if (!((p0 != null) && (v0 != null))) {
      nu0 = originBody.orbit.trueAnomalyAt(t0);
      if (p0 == null) {
        p0 = originBody.orbit.positionAtTrueAnomaly(nu0);
      }
      if (v0 == null) {
        v0 = originBody.orbit.velocityAtTrueAnomaly(nu0);
      }
    }
    if (!((p1 != null) && (v1 != null))) {
      nu1 = destinationBody.orbit.trueAnomalyAt(t1);
      if (p1 == null) {
        p1 = destinationBody.orbit.positionAtTrueAnomaly(nu1);
      }
      if (v1 == null) {
        v1 = destinationBody.orbit.velocityAtTrueAnomaly(nu1);
      }
    }
    if (n0 == null) {
      n0 = originBody.orbit.normalVector();
    }
    if (transferType === "optimal") {
      ballisticTransfer = Orbit.transfer("ballistic", originBody, destinationBody, t0, dt, initialOrbitalVelocity, finalOrbitalVelocity, p0, v0, n0, p1, v1);
      if (ballisticTransfer.angle <= HALF_PI) {
        return ballisticTransfer;
      }
      planeChangeTransfer = Orbit.transfer("optimalPlaneChange", originBody, destinationBody, t0, dt, initialOrbitalVelocity, finalOrbitalVelocity, p0, v0, n0, p1, v1);
      if (ballisticTransfer.deltaV < planeChangeTransfer.deltaV) {
        return ballisticTransfer;
      } else {
        return planeChangeTransfer;
      }
    } else if (transferType === "optimalPlaneChange") {
      if (numeric.norm2(p0) > numeric.norm2(p1)) {
        x1 = HALF_PI;
        x2 = Math.PI;
      } else {
        x1 = 0;
        x2 = HALF_PI;
      }
      relativeInclination = Math.asin(numeric.dotVV(p1, n0) / numeric.norm2(p1));
      planeChangeRotation = quaternion.fromAngleAxis(-relativeInclination, crossProduct(p1, n0));
      p1InOriginPlane = quaternion.rotate(planeChangeRotation, p1);
      v1InOriginPlane = quaternion.rotate(planeChangeRotation, v1);
      ejectionVelocity = lambert(referenceBody.gravitationalParameter, p0, p1InOriginPlane, dt)[0][0];
      orbit = Orbit.fromPositionAndVelocity(referenceBody, p0, ejectionVelocity, t0);
      trueAnomalyAtIntercept = orbit.trueAnomalyAtPosition(p1InOriginPlane);
      x = goldenSectionSearch(x1, x2, 1e-2, function(x) {
        var planeChangeAngle;

        planeChangeAngle = Math.atan2(Math.tan(relativeInclination), Math.sin(x));
        return Math.abs(2 * orbit.speedAtTrueAnomaly(trueAnomalyAtIntercept - x) * Math.sin(0.5 * planeChangeAngle));
      });
      planeChangeAngle = Math.atan2(Math.tan(relativeInclination), Math.sin(x));
      planeChangeAxis = quaternion.rotate(quaternion.fromAngleAxis(-x, n0), projectToPlane(p1, n0));
      planeChangeRotation = quaternion.fromAngleAxis(planeChangeAngle, planeChangeAxis);
      p1InOriginPlane = quaternion.rotate(planeChangeRotation, p1);
      v1InOriginPlane = quaternion.rotate(planeChangeRotation, v1);
      ejectionVelocity = lambert(referenceBody.gravitationalParameter, p0, p1InOriginPlane, dt)[0][0];
      orbit = Orbit.fromPositionAndVelocity(referenceBody, p0, ejectionVelocity, t0);
      trueAnomalyAtIntercept = orbit.trueAnomalyAtPosition(p1InOriginPlane);
      x = goldenSectionSearch(x1, x2, 1e-2, function(x) {
        planeChangeAngle = Math.atan2(Math.tan(relativeInclination), Math.sin(x));
        return Math.abs(2 * orbit.speedAtTrueAnomaly(trueAnomalyAtIntercept - x) * Math.sin(0.5 * planeChangeAngle));
      });
      return Orbit.transfer("planeChange", originBody, destinationBody, t0, dt, initialOrbitalVelocity, finalOrbitalVelocity, p0, v0, n0, p1, v1, x);
    } else if (transferType === "planeChange") {
      if (planeChangeAngleToIntercept == null) {
        planeChangeAngleToIntercept = HALF_PI;
      }
      relativeInclination = Math.asin(numeric.dotVV(p1, n0) / numeric.norm2(p1));
      planeChangeAngle = Math.atan2(Math.tan(relativeInclination), Math.sin(planeChangeAngleToIntercept));
      if (planeChangeAngle !== 0) {
        planeChangeAxis = quaternion.rotate(quaternion.fromAngleAxis(-planeChangeAngleToIntercept, n0), projectToPlane(p1, n0));
        planeChangeRotation = quaternion.fromAngleAxis(planeChangeAngle, planeChangeAxis);
        p1InOriginPlane = quaternion.rotate(quaternion.conjugate(planeChangeRotation), p1);
      }
    }
    transferAngle = Math.acos(numeric.dotVV(p0, p1) / (numeric.norm2(p0) * numeric.norm2(p1)));
    if (p0[0] * p1[1] - p0[1] * p1[0] < 0) {
      transferAngle = TWO_PI - transferAngle;
    }
    if (!planeChangeAngle || transferAngle <= HALF_PI) {
      solutions = lambert(referenceBody.gravitationalParameter, p0, p1, dt, 10);
      minDeltaV = Infinity;
      for (_i = 0, _len = solutions.length; _i < _len; _i++) {
        s = solutions[_i];
        dv = numeric.norm2(numeric.subVV(s[0], v0));
        if (typeof finalOrbitVelocity !== "undefined" && finalOrbitVelocity !== null) {
          dv += numeric.norm2(numeric.subVV(s[1], v1));
        }
        if (dv < minDeltaV) {
          minDeltaV = dv;
          ejectionVelocity = s[0], insertionVelocity = s[1], transferAngle = s[2];
        }
      }
      planeChangeDeltaV = 0;
    } else {
      _ref = lambert(referenceBody.gravitationalParameter, p0, p1InOriginPlane, dt)[0], ejectionVelocity = _ref[0], insertionVelocity = _ref[1];
      orbit = Orbit.fromPositionAndVelocity(referenceBody, p0, ejectionVelocity, t0);
      planeChangeTrueAnomaly = orbit.trueAnomalyAt(t1) - planeChangeAngleToIntercept;
      planeChangeDeltaV = Math.abs(2 * orbit.speedAtTrueAnomaly(planeChangeTrueAnomaly) * Math.sin(planeChangeAngle / 2));
      if (isNaN(planeChangeDeltaV)) {
        planeChangeDeltaV = 0;
      }
      planeChangeTime = orbit.timeAtTrueAnomaly(planeChangeTrueAnomaly, t0);
      insertionVelocity = quaternion.rotate(planeChangeRotation, insertionVelocity);
    }
    ejectionDeltaVector = numeric.subVV(ejectionVelocity, v0);
    ejectionDeltaV = numeric.norm2(ejectionDeltaVector);
    ejectionInclination = Math.asin(ejectionDeltaVector[2] / ejectionDeltaV);
    if (initialOrbitalVelocity) {
      ejectionDeltaV = circularToEscapeDeltaV(originBody, initialOrbitalVelocity, ejectionDeltaV, ejectionInclination);
    }
    if (finalOrbitalVelocity != null) {
      insertionDeltaVector = numeric.subVV(insertionVelocity, v1);
      insertionDeltaV = numeric.norm2(insertionDeltaVector);
      insertionInclination = Math.asin(insertionDeltaVector[2] / insertionDeltaV);
      if (finalOrbitalVelocity) {
        insertionDeltaV = insertionToCircularDeltaV(destinationBody, insertionDeltaV, finalOrbitalVelocity);
      }
    } else {
      insertionDeltaV = 0;
    }
    return {
      angle: transferAngle,
      orbit: orbit,
      ejectionVelocity: ejectionVelocity,
      ejectionDeltaVector: ejectionDeltaVector,
      ejectionInclination: ejectionInclination,
      ejectionDeltaV: ejectionDeltaV,
      planeChangeAngleToIntercept: planeChangeAngleToIntercept,
      planeChangeDeltaV: planeChangeDeltaV,
      planeChangeTime: planeChangeTime,
      planeChangeAngle: planeChangeTime != null ? planeChangeAngle : 0,
      insertionVelocity: insertionVelocity,
      insertionInclination: insertionInclination,
      insertionDeltaV: insertionDeltaV,
      deltaV: ejectionDeltaV + planeChangeDeltaV + insertionDeltaV
    };
  };

  Orbit.transferDetails = function(transfer, originBody, t0, initialOrbitalVelocity) {
    var a, burnDirection, e, ejectionDeltaV, ejectionDeltaVector, ejectionInclination, initialOrbitRadius, mu, n0, normalDeltaV, nu0, p0, positionDirection, progradeDeltaV, progradeDirection, radialDeltaV, referenceBody, rsoi, theta, v0, v1, vsoi, _ref;

    referenceBody = originBody.orbit.referenceBody;
    nu0 = originBody.orbit.trueAnomalyAt(t0);
    p0 = originBody.orbit.positionAtTrueAnomaly(nu0);
    v0 = originBody.orbit.velocityAtTrueAnomaly(nu0);
    if ((_ref = transfer.orbit) == null) {
      transfer.orbit = Orbit.fromPositionAndVelocity(referenceBody, p0, transfer.ejectionVelocity, t0);
    }
    ejectionDeltaVector = transfer.ejectionDeltaVector;
    ejectionInclination = transfer.ejectionInclination;
    if (initialOrbitalVelocity) {
      mu = originBody.gravitationalParameter;
      rsoi = originBody.sphereOfInfluence;
      vsoi = numeric.norm2(ejectionDeltaVector);
      v1 = Math.sqrt(vsoi * vsoi + 2 * initialOrbitalVelocity * initialOrbitalVelocity - 2 * mu / rsoi);
      transfer.ejectionNormalDeltaV = v1 * Math.sin(ejectionInclination);
      transfer.ejectionProgradeDeltaV = v1 * Math.cos(ejectionInclination) - initialOrbitalVelocity;
      transfer.ejectionHeading = Math.atan2(transfer.ejectionProgradeDeltaV, transfer.ejectionNormalDeltaV);
      initialOrbitRadius = mu / (initialOrbitalVelocity * initialOrbitalVelocity);
      e = initialOrbitRadius * v1 * v1 / mu - 1;
      a = initialOrbitRadius / (1 - e);
      theta = Math.acos((a * (1 - e * e) - rsoi) / (e * rsoi));
      theta += Math.asin(v1 * initialOrbitRadius / (vsoi * rsoi));
      transfer.ejectionAngle = ejectionAngle(ejectionDeltaVector, theta, normalize(v0));
    } else {
      ejectionDeltaV = transfer.ejectionDeltaV;
      positionDirection = numeric.divVS(p0, numeric.norm2(p0));
      progradeDirection = numeric.divVS(v0, numeric.norm2(v0));
      n0 = originBody.orbit.normalVector();
      burnDirection = numeric.divVS(ejectionDeltaVector, ejectionDeltaV);
      transfer.ejectionPitch = Math.asin(numeric.dotVV(burnDirection, positionDirection));
      transfer.ejectionHeading = angleInPlane([0, 0, 1], burnDirection, positionDirection);
      progradeDeltaV = numeric.dotVV(ejectionDeltaVector, progradeDirection);
      normalDeltaV = numeric.dotVV(ejectionDeltaVector, n0);
      radialDeltaV = Math.sqrt(ejectionDeltaV * ejectionDeltaV - progradeDeltaV * progradeDeltaV - normalDeltaV * normalDeltaV);
      if (numeric.dotVV(crossProduct(burnDirection, progradeDirection), n0) < 0) {
        radialDeltaV = -radialDeltaV;
      }
      transfer.ejectionProgradeDeltaV = progradeDeltaV;
      transfer.ejectionNormalDeltaV = normalDeltaV;
      transfer.ejectionRadialDeltaV = radialDeltaV;
    }
    return transfer;
  };

  Orbit.refineTransfer = function(transfer, transferType, originBody, destinationBody, t0, dt, initialOrbitalVelocity, finalOrbitalVelocity) {
    var a, argumentOfPeriapsis, dtFromSOI, e, ejectionOrbit, i, initialOrbitRadius, lastEjectionDeltaVector, longitudeOfAscendingNode, mu, nu, orbit, originOrbit, originTrueAnomalyAtSOI, originVelocityAtSOI, p1, prograde, rsoi, t1, tempBody, v1, vsoi, _i;

    if (!initialOrbitalVelocity) {
      return transfer;
    }
    for (i = _i = 1; _i <= 10; i = ++_i) {
      if (isNaN(transfer.deltaV)) {
        return transfer;
      }
      if (transfer.ejectionAngle == null) {
        transfer = Orbit.transferDetails(transfer, originBody, t0, initialOrbitalVelocity);
      }
      mu = originBody.gravitationalParameter;
      rsoi = originBody.sphereOfInfluence;
      vsoi = numeric.norm2(transfer.ejectionDeltaVector);
      v1 = Math.sqrt(vsoi * vsoi + 2 * initialOrbitalVelocity * initialOrbitalVelocity - 2 * mu / rsoi);
      initialOrbitRadius = mu / (initialOrbitalVelocity * initialOrbitalVelocity);
      e = initialOrbitRadius * v1 * v1 / mu - 1;
      a = initialOrbitRadius / (1 - e);
      nu = Math.acos((a * (1 - e * e) - rsoi) / (e * rsoi));
      originOrbit = originBody.orbit;
      prograde = originOrbit.velocityAtTrueAnomaly(originOrbit.trueAnomalyAt(t0));
      longitudeOfAscendingNode = Math.atan2(prograde[1], prograde[0]) - transfer.ejectionAngle;
      argumentOfPeriapsis = 0;
      if (transfer.ejectionInclination < 0) {
        longitudeOfAscendingNode -= Math.PI;
        argumentOfPeriapsis = Math.PI;
      }
      while (longitudeOfAscendingNode < 0) {
        longitudeOfAscendingNode += TWO_PI;
      }
      ejectionOrbit = new Orbit(originBody, a, e, null, null, null, null, t0);
      ejectionOrbit.inclination = transfer.ejectionInclination;
      ejectionOrbit.longitudeOfAscendingNode = longitudeOfAscendingNode;
      ejectionOrbit.argumentOfPeriapsis = argumentOfPeriapsis;
      t1 = ejectionOrbit.timeAtTrueAnomaly(nu, t0);
      dtFromSOI = dt - (t1 - t0);
      originTrueAnomalyAtSOI = originOrbit.trueAnomalyAt(t1);
      p1 = numeric.addVV(ejectionOrbit.positionAtTrueAnomaly(nu), originOrbit.positionAtTrueAnomaly(originTrueAnomalyAtSOI));
      originVelocityAtSOI = originOrbit.velocityAtTrueAnomaly(originTrueAnomalyAtSOI);
      orbit = Orbit.fromPositionAndVelocity(originOrbit.referenceBody, p1, originVelocityAtSOI, t1);
      tempBody = new CelestialBody(null, null, null, orbit);
      transfer = Orbit.transfer(transferType, tempBody, destinationBody, t1, dtFromSOI, 0, finalOrbitalVelocity, p1, originVelocityAtSOI);
      if (i & 1) {
        lastEjectionDeltaVector = transfer.ejectionDeltaVector;
      } else {
        transfer.ejectionDeltaVector = numeric.mulSV(0.5, numeric.addVV(lastEjectionDeltaVector, transfer.ejectionDeltaVector));
        transfer.ejectionDeltaV = numeric.norm2(transfer.ejectionDeltaVector);
      }
      transfer.orbit = Orbit.fromPositionAndVelocity(originOrbit.referenceBody, p1, transfer.ejectionVelocity, t1);
      transfer.ejectionDeltaV = circularToEscapeDeltaV(originBody, initialOrbitalVelocity, transfer.ejectionDeltaV, transfer.ejectionInclination);
      transfer.deltaV = transfer.ejectionDeltaV + transfer.planeChangeDeltaV + transfer.insertionDeltaV;
    }
    return transfer;
  };

  Orbit.courseCorrection = function(transferOrbit, destinationOrbit, burnTime, eta) {
    var burnDirection, correctedVelocity, deltaV, deltaVector, heading, mu, n0, n1, normalDeltaV, p0, pitch, positionDirection, progradeDeltaV, progradeDirection, radialDeltaV, t1, t1Max, t1Min, trueAnomaly, v0, velocityForArrivalAt;

    mu = transferOrbit.referenceBody.gravitationalParameter;
    trueAnomaly = transferOrbit.trueAnomalyAt(burnTime);
    p0 = transferOrbit.positionAtTrueAnomaly(trueAnomaly);
    v0 = transferOrbit.velocityAtTrueAnomaly(trueAnomaly);
    n0 = transferOrbit.normalVector();
    n1 = destinationOrbit.normalVector();
    velocityForArrivalAt = function(t1) {
      var p1;

      p1 = destinationOrbit.positionAtTrueAnomaly(destinationOrbit.trueAnomalyAt(t1));
      return lambert(mu, p0, p1, t1 - burnTime)[0][0];
    };
    t1Min = Math.max(0.5 * (eta - burnTime), 3600);
    t1Max = 1.5 * (eta - burnTime);
    t1 = goldenSectionSearch(t1Min, t1Max, 1e-4, function(t1) {
      return numeric.norm2Squared(numeric.subVV(velocityForArrivalAt(burnTime + t1), v0));
    });
    t1 = t1 + burnTime;
    correctedVelocity = velocityForArrivalAt(t1);
    deltaVector = numeric.subVV(correctedVelocity, v0);
    deltaV = numeric.norm2(deltaVector);
    burnDirection = numeric.divVS(deltaVector, deltaV);
    positionDirection = numeric.divVS(p0, numeric.norm2(p0));
    pitch = Math.asin(numeric.dotVV(burnDirection, positionDirection));
    heading = angleInPlane([0, 0, 1], burnDirection, positionDirection);
    progradeDirection = numeric.divVS(v0, numeric.norm2(v0));
    progradeDeltaV = numeric.dotVV(deltaVector, progradeDirection);
    normalDeltaV = numeric.dotVV(deltaVector, n0);
    radialDeltaV = Math.sqrt(deltaV * deltaV - progradeDeltaV * progradeDeltaV - normalDeltaV * normalDeltaV);
    if (numeric.dotVV(crossProduct(burnDirection, progradeDirection), n0) < 0) {
      radialDeltaV = -radialDeltaV;
    }
    return {
      correctedVelocity: correctedVelocity,
      deltaVector: deltaVector,
      deltaV: deltaV,
      pitch: pitch,
      heading: heading,
      progradeDeltaV: progradeDeltaV,
      normalDeltaV: normalDeltaV,
      radialDeltaV: radialDeltaV,
      arrivalTime: t1
    };
  };

}).call(this);