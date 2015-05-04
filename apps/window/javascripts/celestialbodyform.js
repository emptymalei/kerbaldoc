// Generated by CoffeeScript 1.6.2
(function() {
  var CelestialBodyForm, isBlank;

  isBlank = function(str) {
    return !/\S/.test(str);
  };

  CelestialBodyForm = (function() {
    function CelestialBodyForm(form) {
      var _this = this;

      this.form = form;
      $('#bodyType a', this.form).click(function(event) {
        event.preventDefault();
        $(event.target).tab('show');
        return $('#bodySaveBtn', _this.form).prop('disabled', $('#bodyForm .form-group.has-error:visible').length > 0);
      });
      $('#bodySaveBtn', this.form).click(function(event) {
        return _this.save();
      });
      $('#bodyName', this.form).blur(function(event) {
        return _this.validateName(event.target);
      });
      $('#semiMajorAxis,#planetMass,#planetRadius').blur(function(event) {
        return _this.validateGreaterThanZero(event.target);
      });
      $('#eccentricity', this.form).blur(function(event) {
        return _this.validateEccentricity(event.target);
      });
      $('#inclination', this.form).blur(function(event) {
        return _this.validateAngle(event.target, 180);
      });
      $('#longitudeOfAscendingNode,#argumentOfPeriapsis', this.form).blur(function(event) {
        return _this.validateAngle(event.target);
      });
      $('#meanAnomalyAtEpoch', this.form).blur(function(event) {
        return _this.validateMeanAnomaly(event.target);
      });
      $('#timeOfPeriapsisPassage', this.form).blur(function(event) {
        return _this.validateDate(event.target);
      });
    }

    CelestialBodyForm.prototype.add = function(referenceBody) {
      if (referenceBody == null) {
        referenceBody = null;
      }
      $('.form-group', this.form).removeClass('has-error');
      $('.help-block', this.form).hide();
      $('#bodyType a[href="#planetFields"]', this.form).tab('show');
      if (referenceBody != null) {
        $('#referenceBodySelect', this.form).val(referenceBody.name()).prop('disabled', true);
        $('.modal-header h4', this.form).text("New destination orbiting " + (referenceBody.name()));
      } else {
        $('#referenceBodySelect', this.form).val('Kerbol').prop('disabled', false);
        $('.modal-header h4', this.form).text("New origin body");
      }
      $('#bodyName', this.form).val('').removeData('originalValue');
      $('#semiMajorAxis,#eccentricity,#inclination,#longitudeOfAscendingNode,#argumentOfPeriapsis,#meanAnomalyAtEpoch,#planetMass,#planetRadius,#timeOfPeriapsisPassage', this.form).val('');
      return this.form.modal();
    };

    CelestialBodyForm.prototype.edit = function(body, fixedReferenceBody) {
      var orbit;

      if (fixedReferenceBody == null) {
        fixedReferenceBody = false;
      }
      $('.form-group', this.form).removeClass('has-error');
      $('.help-block', this.form).hide();
      orbit = body.orbit;
      if (body.mass != null) {
        $('#bodyType a[href="#planetFields"]', this.form).tab('show');
        $('#vesselFields input', this.form).val('');
        $('#meanAnomalyAtEpoch', this.form).val(orbit.meanAnomalyAtEpoch);
        $('#planetMass', this.form).val(body.mass);
        $('#planetRadius', this.form).val(body.radius / 1000);
      } else {
        $('#bodyType a[href="#vesselFields"]', this.form).tab('show');
        $('#planetFields input', this.form).val('');
        $('#timeOfPeriapsisPassage', this.form).val(new KerbalTime(orbit.timeOfPeriapsisPassage).toShortDateString());
      }
      $('.modal-header h4', this.form).text("Editing " + (body.name()));
      $('#bodyName', this.form).val(body.name()).data('originalValue', body.name());
      $('#referenceBodySelect', this.form).val(body.orbit.referenceBody.name()).prop('disabled', fixedReferenceBody);
      $('#semiMajorAxis', this.form).val(orbit.semiMajorAxis / 1000);
      $('#eccentricity', this.form).val(orbit.eccentricity);
      $('#inclination', this.form).val(orbit.inclination * 180 / Math.PI);
      $('#longitudeOfAscendingNode', this.form).val(orbit.longitudeOfAscendingNode * 180 / Math.PI);
      $('#argumentOfPeriapsis', this.form).val(orbit.argumentOfPeriapsis * 180 / Math.PI);
      return this.form.modal();
    };

    CelestialBodyForm.prototype.save = function() {
      var argumentOfPeriapsis, body, eccentricity, inclination, k, longitudeOfAscendingNode, mass, meanAnomalyAtEpoch, name, newBody, orbit, originalBody, originalDestination, originalName, originalOrigin, radius, referenceBody, semiMajorAxis, timeOfPeriapsisPassage, _ref;

      $('input:visible', this.form).filter(function() {
        return isBlank($(this).val());
      }).closest('.form-group').addClass('has-error').find('.help-block').text('A value is required').show();
      if ($('.form-group.has-error:visible', this.form).length > 0) {
        $('#bodySaveBtn', this.form).disabled = true;
        return;
      }
      name = $('#bodyName').val();
      originalName = $('#bodyName').data('originalValue');
      referenceBody = CelestialBody[$('#referenceBodySelect').val()];
      semiMajorAxis = +$('#semiMajorAxis').val() * 1000;
      eccentricity = +$('#eccentricity').val();
      inclination = +$('#inclination').val();
      longitudeOfAscendingNode = +$('#longitudeOfAscendingNode').val();
      argumentOfPeriapsis = +$('#argumentOfPeriapsis').val();
      if ($('#planetFields').is(':visible')) {
        meanAnomalyAtEpoch = +$('#meanAnomalyAtEpoch').val();
        mass = +$('#planetMass').val();
        radius = +$('#planetRadius').val() * 1000;
      } else {
        timeOfPeriapsisPassage = KerbalTime.parse($('#timeOfPeriapsisPassage').val());
      }
      orbit = new Orbit(referenceBody, semiMajorAxis, eccentricity, inclination, longitudeOfAscendingNode, argumentOfPeriapsis, meanAnomalyAtEpoch, timeOfPeriapsisPassage);
      if (originalName != null) {
        originalBody = CelestialBody[originalName];
        delete CelestialBody[originalName];
      }
      newBody = CelestialBody[name] = new CelestialBody(mass, radius, null, orbit);
      if (originalBody != null) {
        _ref = originalBody.children();
        for (k in _ref) {
          body = _ref[k];
          body.orbit.referenceBody = newBody;
        }
      }
      if ($('#referenceBodySelect').prop('disabled')) {
        originalOrigin = $('#originSelect').val();
        prepareOrigins();
        $('#originSelect').val(originalOrigin).change();
        $('#destinationSelect').val(name).change();
      } else {
        originalDestination = $('#destinationSelect').val();
        prepareOrigins();
        $('#originSelect').val(name).change();
        if (CelestialBody[originalDestination].orbit.referenceBody === referenceBody) {
          $('#destinationSelect').val(originalDestination).change();
        }
      }
      updateAdvancedControls();
      return this.form.modal('hide');
    };

    CelestialBodyForm.prototype.validateName = function(input) {
      var $input, val;

      $input = $(input);
      val = $input.val().trim();
      if (isBlank(val)) {
        $input.closest('.form-group').addClass('has-error').find('.help-block').text('A name is required').show();
      } else if (val !== $input.data('originalValue') && val in CelestialBody) {
        $input.closest('.form-group').addClass('has-error').find('.help-block').text("A body named " + val + " already exists").show();
      } else {
        $input.closest('.form-group').removeClass('has-error').find('.help-block').hide();
      }
      return $('#bodySaveBtn').prop('disabled', $('#bodyForm .form-group.has-error:visible').length > 0);
    };

    CelestialBodyForm.prototype.validateGreaterThanZero = function(input) {
      var $input, val;

      $input = $(input);
      val = $input.val();
      if (isNaN(val) || isBlank(val)) {
        $input.closest('.form-group').addClass('has-error').find('.help-block').text('Must be a number').show();
      } else if (val <= 0) {
        $input.closest('.form-group').addClass('has-error').find('.help-block').text('Must be greater than 0').show();
      } else {
        $input.closest('.form-group').removeClass('has-error').find('.help-block').hide();
      }
      return $('#bodySaveBtn').prop('disabled', $('#bodyForm .form-group.has-error:visible').length > 0);
    };

    CelestialBodyForm.prototype.validateEccentricity = function(input) {
      var $input, val;

      $input = $(input);
      val = $input.val();
      if (isNaN(val) || isBlank(val)) {
        $input.closest('.form-group').addClass('has-error').find('.help-block').text('Must be a number').show();
      } else if (val < 0 || val >= 1) {
        $input.closest('.form-group').addClass('has-error').find('.help-block').text('Must be between 0 and 1 (hyperbolic orbits are not supported)').show();
      } else {
        $input.closest('.form-group').removeClass('has-error').find('.help-block').hide();
      }
      return $('#bodySaveBtn').prop('disabled', $('#bodyForm .form-group.has-error:visible').length > 0);
    };

    CelestialBodyForm.prototype.validateAngle = function(input, maxAngle) {
      var $input, val;

      if (maxAngle == null) {
        maxAngle = 360;
      }
      $input = $(input);
      val = $input.val();
      if (isNaN(val) || isBlank(val)) {
        $input.closest('.form-group').addClass('has-error').find('.help-block').text('Must be a number').show();
      } else if (val < 0 || val > maxAngle) {
        $input.closest('.form-group').addClass('has-error').find('.help-block').text("Must be between 0\u00B0 and " + maxAngle + "\u00B0").show();
      } else {
        $input.closest('.form-group').removeClass('has-error').find('.help-block').hide();
      }
      return $('#bodySaveBtn').prop('disabled', $('#bodyForm .form-group.has-error:visible').length > 0);
    };

    CelestialBodyForm.prototype.validateMeanAnomaly = function(input) {
      var $input, val;

      $input = $(input);
      val = $input.val();
      if (isNaN(val) || isBlank(val)) {
        $input.closest('.form-group').addClass('has-error').find('.help-block').text('Must be a number').show();
      } else if (val < 0 || val > 2 * Math.PI) {
        $input.closest('.form-group').addClass('has-error').find('.help-block').text("Must be between 0 and 2\u03c0 (6.28\u2026)").show();
      } else {
        $input.closest('.form-group').removeClass('has-error').find('.help-block').hide();
      }
      return $('#bodySaveBtn').prop('disabled', $('#bodyForm .form-group.has-error:visible').length > 0);
    };

    CelestialBodyForm.prototype.validateDate = function(input) {
      var $input, val;

      $input = $(this);
      val = $input.val();
      if (isBlank(val)) {
        $input.closest('.form-group').addClass('has-error').find('.help-block').text('Must be a Kerbal date').show();
      } else if (!/^\s*\d*[1-9]\d*\/\d*[1-9]\d*\s+\d+:\d+:\d+\s*$/.test(val)) {
        $input.closest('.form-group').addClass('has-error').find('.help-block').text('Must be a valid Kerbal date: year/day hour:min:sec').show();
      } else {
        $input.closest('.form-group').removeClass('has-error').find('.help-block').hide();
      }
      return $('#bodySaveBtn').prop('disabled', $('#bodyForm .form-group.has-error:visible').length > 0);
    };

    return CelestialBodyForm;

  })();

  (typeof exports !== "undefined" && exports !== null ? exports : this).CelestialBodyForm = CelestialBodyForm;

}).call(this);
