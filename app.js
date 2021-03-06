(function() {
  var VIP_COUNT = 100;

  return {
    events: {
      'app.activated':'getInfo',
      'userGetRequest.done':'this.showInfo',
      'userGetRequest.fail':'this.showError',

      'click .orderbutton':'getOrders',
      'hmcGetRequest.done':'this.showOrders',
      'hmcGetRequest.fail':'this.showError' // A bit dramatic, but...
    },

    requests: {
      hmcGetRequest: function(email) {
        var webroot = 'http://ec2-52-24-133-26.us-west-2.compute.amazonaws.com:5000';
        return {
          url: webroot + '/api/' + email,
          type: 'GET',
          dataType: 'json'
        };
      },

      orgGetRequest: function(id) {
        return {
          url: '/api/v2/organizations/' + id + '.json',
          type: 'GET',
          dataType: 'json'
        };
      },

      userGetRequest: function(id) {
        return {
          url: '/api/v2/users/' + id + '.json',
          type: 'GET',
          dataType: 'json'
        };
      }
    },

    formatDates: function(data) {
      var ldate = new Date(data.user.last_login_at);
      data.user.last_login_at = ldate.toLocaleString();
      return data;
    },

    getInfo: function() {
      var id = this.ticket().requester().id();
      this.ajax('userGetRequest', id);
    },

    getOrders: function() {
      if ( this.$('.ordertable').length ) {
        var email = this.ticket().requester().email();
        this.ajax('hmcGetRequest', email);
      } else {
        console.log('Cannot load orders before user info');
      }
    },

    showOrders: function(data) {
      ['total', 'widget', 'doodad', 'gewgaw'].forEach(
        function(currVal) {
          var numOrders = data.orders[currVal];
          var orderField = this.$('.order_' + currVal);
          orderField.text(numOrders);
          if (numOrders >= VIP_COUNT) {
            this.ticket().tags().add('vip_' + currVal);
            orderField.html('<span class="vip">' + orderField.text() + '</span>');
          }
        }.bind(this) //preserve meaning of this inside forEach
      );
    },

    showInfo: function(data) {
      this.formatDates(data);
      // It seemed like this information should already be accessible
      // as part of the user object, but it wasn't entirely clear to
      // me how to access it, so I'm shovin' it in myself.
      data.user.iconUrl = this.ticket().requester().avatarUrl();
      if (data.user.organization_id == null) {
        this.switchTo('customer_info', data);
      } else {
        this.ajax('orgGetRequest', data.user.organization_id).then(
          function(org_data) {
            data.user.organization_name = org_data.organization.name;
            this.switchTo('customer_info', data);
          },
          function() {
            this.showError();
          }
        );
      }
    },

    showError: function() {
      this.switchTo('error');
    }
  };

}());
