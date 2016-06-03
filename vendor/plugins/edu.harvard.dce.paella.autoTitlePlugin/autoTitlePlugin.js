Class ("paella.plugins.AutoTitlePlugin", paella.EventDrivenPlugin, {
  _isFirstTime: true,
  getName: function() {
    return "edu.harvard.dce.paella.autoTitlePlugin";
  },

  getEvents: function(){
    return [paella.events.loadPlugins, paella.events.singleVideoReady];
  },

  _createSeriesTitleNode: function(){
    var nodeToInsert = '';
    try {
      var dcObj = paella.matterhorn.serie['http://purl.org/dc/terms/'];
      nodeToInsert = jQuery('<div class="seriesInfo" />').append(
          jQuery('<a />').attr({
            'title': 'Go to ' + dcObj.title[0].value,
            'href': dcObj.description[0].value
          }).html(
            dcObj.title[0].value
            ).append(
              jQuery('<span class="seriesTitle" />').text(' :: ' + dcObj.subject[0].value)
            )
          );
    } catch(err) {
      console.log(err.message);
    }
    return nodeToInsert;
  },

  onEvent: function(event, params) {
    if (this._isFirstTime) {
      jQuery('#dceHeaderBannerless').append(this._createSeriesTitleNode());
      this._isFirstTime = false;
    }
  }
});

paella.plugins.autoTitlePlugin = new paella.plugins.AutoTitlePlugin();
