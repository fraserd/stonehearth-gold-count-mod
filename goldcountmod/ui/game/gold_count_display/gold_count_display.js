 $(top).on('stonehearthReady', function(cc) {
     if (!App.gameView) {
         return;
     }

     var goldCountDisplay = App.gameView.getView(App.StonehearthGoldCountDisplayView);
     if (!goldCountDisplay) {
         var view = App.gameView.addView(App.StonehearthGoldCountDisplayView, {});
     }
 });

 App.StonehearthGoldCountDisplayView = App.View.extend({
     templateName: 'goldCountDisplay',
     uriProperty: 'model',
     components: {},
     itemTraces: {
         "tracking_data": {
             "stonehearth:loot:gold": {
                 "items": {
                     "*": {
                         "stonehearth:stacks": {}
                     }
                 }
             }
         }
     },

     init: function() {
         this._super();
         var self = this;
     },

     _updateVisibility: function(show) {
         var self = this;
         var selectedEntity = self.get('uri');
         if (App.getGameMode() == 'normal' && selectedEntity && show) {
             self.set('isVisible', true);
         } else {
             self.set('isVisible', false);
         }
     },

     supressSelection: function(supress) {},

     didInsertElement: function() {
         var self = this;
         self._super();

         self._goldPalette = self.$('#gold-item-palette').stonehearthItemPalette({
             cssClass: 'goldItem',
             filter: function(item) {
                 if (item.uri === "stonehearth:loot:gold") {
                     return true;
                 }
                 return false;
             }
         });

         radiant.call_obj('stonehearth.inventory', 'get_item_tracker_command', 'stonehearth:basic_inventory_tracker')
             .done(function(response) {
                 if (self.isDestroying || self.isDestroyed) {
                     return;
                 }

                 self._itemTracker = response.tracker;

                 if (!self._goldPalette) {
                     return;
                 }
                 self._playerInventoryTrace = new StonehearthDataTrace(self._itemTracker, self.itemTraces)
                     .progress(function(response) {
                         var inventoryItems = {};
                         var stackSum = 0;
                         radiant.each(response.tracking_data, function(uri, item) {
                             if (uri === "stonehearth:loot:gold") {
                                 if (!inventoryItems[uri]) {
                                     inventoryItems[uri] = item;
                                 }

                                 stackSum += radiant.map_to_array(inventoryItems[uri].items).reduce(function(a, b) {
                                     return a + b["stonehearth:stacks"].stacks;
                                 }, stackSum);
                                 inventoryItems[uri].count = stackSum;
                             }
                         });

                         self._goldPalette.stonehearthItemPalette('updateItems', inventoryItems);
                     });
             })
             .fail(function(response) {
                 console.error(response);
             });
     },

     willDestroyElement: function() {
         var self = this;
         self._super();
     },

     commands: function() {},

     actions: {}
 });