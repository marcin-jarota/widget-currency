(function(){
  var widgetsStates = [];
  var widgetDefaults = {
    version: 'extended',
    primaryCurrency: 'USD',
    currencyId: 'btc-bitcoin',
    mainElement: null,
    updateActive: false,
    updateTimeout: '30s',
    showDetailsCurrency: false,
    language: 'en',
    node_modules_src: null,
    bower_src: null,
    style_src: null,
    logo_src: null,
    cdn_src: 'https://cdn.jsdelivr.net/npm/@coinpaprika/widget-currency',
    emptyData: '-',
    emptyValue: 0,
    ticker: {
      name: undefined,
      symbol: undefined,
      price: undefined,
      price_change_24h: undefined,
      rank: undefined,
      price_ath: undefined,
      volume_24h: undefined,
      market_cap: undefined,
      percent_from_price_ath: undefined,
      volume_24h_change_24h: undefined,
      market_cap_change_24h: undefined,
    },
    interval: null,
    isData: false,
    message: 'Data is loading...',
    origin_src: null,
    translations: {},
  };
  var widgetFunctions = {
    init: function(index){
      if (!widgetFunctions.getMainElement(index)) {
        return console.error('Bind failed, no element with class = "coinpaprika-currency-widget"');
      }
      widgetFunctions.getDefaults(index);
      widgetFunctions.setOriginLink(index);
    },
    setOriginLink: function(index){
      var data = widgetsStates[index];
      console.log(data);
      if (data.node_modules_src){
        widgetDefaults.origin_src = data.node_modules_src;
      } else if (data.bower_src){
        widgetDefaults.origin_src = data.bower_src;
      } else {
        widgetDefaults.origin_src = data.cdn_src;
      }
      widgetFunctions.stylesheet();
      widgetFunctions.addWidgetElement(index);
      widgetFunctions.initInterval(index);
    },
    getMainElement: function(index){
      return widgetsStates[index].mainElement;
    },
    getData: function(index){
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://api.coinpaprika.com/v1/widget/'+widgetsStates[index].currencyId+'?quote='+widgetsStates[index].primaryCurrency);
      xhr.onload = function() {
        if (xhr.status === 200) {
          if (!widgetsStates[index].isData) widgetFunctions.updateData(index, 'isData', true);
          widgetFunctions.updateTicker(index, JSON.parse(xhr.responseText));
        }
        else {
          widgetFunctions.onErrorRequest(index, xhr);
        }
      };
      xhr.onerror = function(){
        widgetFunctions.onErrorRequest(index, xhr);
      };
      xhr.send();
    },
    onErrorRequest: function(index, xhr){
      if (widgetsStates[index].isData) widgetFunctions.updateData(index, 'isData', false);
      widgetFunctions.updateData(index, 'message', 'Data is currently unavailable');
      console.error('Request failed.  Returned status of ' + xhr, widgetsStates[index]);
    },
    initInterval: function(index){
      clearInterval(widgetsStates[index].interval);
      if (widgetsStates[index].updateActive && widgetsStates[index].updateTimeout > 1000){
        widgetsStates[index].interval = setInterval(function(){
          widgetFunctions.getData(index);
        }, widgetsStates[index].updateTimeout);
      }
    },
    addWidgetElement: function(index){
      var mainElement = widgetFunctions.getMainElement(index);
      var details = (widgetsStates[index].version === 'extended') ? '<div class="cp-widget__details">' + widgetFunctions.widgetAthElement() + widgetFunctions.widgetVolume24hElement() + widgetFunctions.widgetMarketCapElement() + '</div>' : '';
      var widgetElement = widgetFunctions.widgetMainElement(index) + details + widgetFunctions.widgetFooter(index);
      mainElement.innerHTML = widgetElement;
      widgetFunctions.getData(index);
    },
    getDefaults: function(index){
      var mainElement = widgetFunctions.getMainElement(index);
      if (mainElement.dataset){
        if (mainElement.dataset.version) widgetFunctions.updateData(index, 'version', mainElement.dataset.version);
        if (mainElement.dataset.primaryCurrency) widgetFunctions.updateData(index, 'primaryCurrency', mainElement.dataset.primaryCurrency);
        if (mainElement.dataset.currency) widgetFunctions.updateData(index, 'currencyId', mainElement.dataset.currency);
        if (mainElement.dataset.showDetailsCurrency) widgetFunctions.updateData(index, 'showDetailsCurrency', (mainElement.dataset.showDetailsCurrency === 'true'));
        if (mainElement.dataset.updateActive) widgetFunctions.updateData(index, 'updateActive', (mainElement.dataset.updateActive === 'true'));
        if (mainElement.dataset.updateTimeout) widgetFunctions.updateData(index, 'updateTimeout', widgetFunctions.parseIntervalValue(mainElement.dataset.updateTimeout));
        if (mainElement.dataset.language) widgetFunctions.updateData(index, 'language', mainElement.dataset.language);
        if (mainElement.dataset.nodeModulesSrc) widgetFunctions.updateData(index, 'node_modules_src', mainElement.dataset.nodeModulesSrc);
        if (mainElement.dataset.bowerSrc) widgetFunctions.updateData(index, 'bower_src', mainElement.dataset.bowerSrc);
        if (mainElement.dataset.styleSrc) widgetFunctions.updateData(index, 'style_src', mainElement.dataset.styleSrc);
        if (mainElement.dataset.logoSrc) widgetFunctions.updateData(index, 'logo_src', mainElement.dataset.logoSrc);
        if (mainElement.dataset.showDetailsCurrency) widgetFunctions.updateData(index, 'showDetailsCurrency', mainElement.dataset.showDetailsCurrency);
      }
    },
    updateWidgetElement: function(index, key, value, ticker){
      var state = widgetsStates[index];
      var mainElement = widgetFunctions.getMainElement(index);
      if (mainElement){
        var tickerClass = (ticker) ? 'Ticker' : '';
        if (key === 'name' || key === 'currencyId'){
          if (key === 'currencyId'){
            var aElements = mainElement.querySelectorAll('.cp-widget__footer > a');
            for(var k = 0; k < aElements.length; k++) {
              aElements[k].href = widgetFunctions.coin_link(value);
            }
          }
          widgetFunctions.getImage(index);
        }
        if (key === 'isData' || key === 'message'){
          var headerElements = mainElement.querySelectorAll('.cp-widget__main');
          for(var k = 0; k < headerElements.length; k++) {
            headerElements[k].innerHTML = (!state.isData) ? widgetFunctions.widgetMainElementMessage(index) : widgetFunctions.widgetMainElementData(index);
          }
        } else {
          var updateElements = mainElement.querySelectorAll('.'+key+tickerClass);
          for (var j = 0; j < updateElements.length; j++){
            var updateElement = updateElements[j];
            if (updateElement.classList.contains('cp-widget__rank')){
              var className = (parseFloat(value) > 0) ? "cp-widget__rank-up" : ((parseFloat(value) < 0) ? "cp-widget__rank-down" : "cp-widget__rank-neutral");
              updateElement.classList.remove('cp-widget__rank-down');
              updateElement.classList.remove('cp-widget__rank-up');
              updateElement.classList.remove('cp-widget__rank-neutral');
              if (value === undefined){
                value = state.emptyData;
              } else {
                updateElement.classList.add(className);
                value = (key === 'price_change_24h') ? '('+widgetFunctions.roundAmount(value, 2)+'%)': widgetFunctions.roundAmount(value, 2)+'%';
              }
            }
            if (updateElement.classList.contains('showDetailsCurrency') && !state.showDetailsCurrency) {
              value = ' ';
            }
            if (updateElement.classList.contains('parseNumber')){
              updateElement.innerText = widgetFunctions.parseNumber(value) || state.emptyData;
            } else {
              updateElement.innerText = value || state.emptyData;
            }
          }
        }
      }
    },
    updateData: function(index, key, value, ticker){
      if (ticker){
        widgetsStates[index].ticker[key] = value;
      } else {
        widgetsStates[index][key] = value;
      }
      widgetFunctions.updateWidgetElement(index, key, value, ticker);
    },
    updateTicker: function(index, data){
      var dataKeys = Object.keys(data);
      for (var i = 0; i < dataKeys.length; i++){
        widgetFunctions.updateData(index, dataKeys[i], data[dataKeys[i]], true);
      }
    },
    parseIntervalValue: function(value){
      var timeSymbol = '', multiplier = 1;
      if (value.search('s') > -1){
        timeSymbol = 's';
        multiplier = 1000;
      }
      if (value.search('m') > -1){
        timeSymbol = 'm';
        multiplier = 60 * 1000;
      }
      if (value.search('h') > -1){
        timeSymbol = 'h';
        multiplier = 60 * 60 * 1000;
      }
      if (value.search('d') > -1){
        timeSymbol = 'd';
        multiplier = 24 * 60 * 60 * 1000;
      }
      return parseFloat(value.replace(timeSymbol,'')) * multiplier;
    },
    parseNumber: function(number){
      if (!number && number !== 0) return number;
      if (number === widgetsStates[0].emptyValue || number === widgetsStates[0].emptyData) return number;
      number = parseFloat(number);
      var numberStr = number.toString();
      if (number > 100000){
        var parameter = 'K',
          spliced = numberStr.slice(0, numberStr.length - 1);
        if (number > 1000000000){
          spliced = numberStr.slice(0, numberStr.length - 7);
          parameter = 'B';
        } else if (number > 1000000){
          spliced = numberStr.slice(0, numberStr.length - 4);
          parameter = 'M';
        }
        var natural = spliced.slice(0, spliced.length - 2);
        var decimal = spliced.slice(spliced.length - 2);
        return natural + '.' + decimal + ' ' + parameter;
      } else {
        var isDecimal = (number % 1) > 0;
        if (isDecimal){
          var precision = 2;
          if (number < 1){
            precision = 8;
          } else if (number < 10){
            precision = 6;
          } else if (number < 1000){
            precision = 4;
          }
          return widgetFunctions.roundAmount(number, precision);
        } else {
          return number.toFixed(2);
        }
      }
    },
    roundAmount: function(amount, decimal, direction){
      amount = parseFloat(amount);
      if (!decimal) decimal = 8;
      if (!direction) direction = 'round';
      decimal = Math.pow(10, decimal);
      return Math[direction](amount * decimal) / decimal;
    },
    stylesheet: function(){
      if (widgetDefaults.style_src !== false){
        var url = widgetDefaults.style_src || widgetDefaults.origin_src +'/dist/widget.min.css';
        var link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', url);
        return (document.body.querySelector('link[href="'+url+'"]')) ? '' : document.body.appendChild(link);
      }
    },
    widgetMainElement: function(index){
      var data = widgetsStates[index];
      return '<div class="cp-widget__header">' +
        '<div class="'+'cp-widget__img cp-widget__img-'+data.currencyId+'">' +
        '<img/>' +
        '</div>' +
        '<div class="cp-widget__main">' +
        ((data.isData) ? widgetFunctions.widgetMainElementData(index) : widgetFunctions.widgetMainElementMessage(index)) +
        '</div>'+
        '</div>';
    },
    widgetMainElementData: function(index){
      var data = widgetsStates[index];
      return '<h3><a href="'+ widgetFunctions.coin_link(data.currencyId) +'">' +
        '<span class="nameTicker">'+ (data.ticker.name || data.emptyData) +'</span>' +
        '<span class="symbolTicker">'+ (data.ticker.symbol || data.emptyData) +'</span>' +
        '</a></h3>' +
        '<strong>' +
        '<span class="priceTicker parseNumber">'+ (widgetFunctions.parseNumber(data.ticker.price) || data.emptyData) + '</span> ' +
        '<span class="primaryCurrency">'+ data.primaryCurrency + ' </span>' +
        '<span class="price_change_24hTicker cp-widget__rank cp-widget__rank-'+ ((data.ticker.price_change_24h > 0) ? "up" : ((data.ticker.price_change_24h < 0) ? "down" : "neutral")) +'">('+ (widgetFunctions.roundAmount(data.ticker.price_change_24h, 2) || data.emptyValue) +'%)</span>' +
        '</strong>' +
        '<span class="cp-widget__rank-label">Rank <span class="rankTicker">'+ (data.ticker.rank || data.emptyData) +'</span></span>';
    },
    widgetMainElementMessage: function(index){
      var message = widgetsStates[index].message;
      return '<div class="cp-widget__main-no-data">'+ (message) +'</div>';
    },
    widgetAthElement: function(){
      return '<div>' +
        '<small>ATH</small>' +
        '<div>' +
        '<span class="price_athTicker parseNumber">'+ widgetsStates[0].emptyData + ' </span>' +
        '<span class="symbolTicker showDetailsCurrency"></span>' +
        '</div>' +
        '<span class="percent_from_price_athTicker cp-widget__rank">'+ widgetsStates[0].emptyData + '</span>' +
        '</div>'
    },
    widgetVolume24hElement: function(){
      return '<div>' +
        '<small>Volume 24h</small>' +
        '<div>' +
        '<span class="volume_24hTicker parseNumber">'+ widgetsStates[0].emptyData + ' </span>' +
        '<span class="symbolTicker showDetailsCurrency"></span>' +
        '</div>' +
        '<span class="volume_24h_change_24hTicker cp-widget__rank">'+ widgetsStates[0].emptyData + '</span>' +
        '</div>';
    },
    widgetMarketCapElement: function(){
      return '<div>' +
        '<small>Market cap</small>' +
        '<div>' +
        '<span class="market_capTicker parseNumber">'+ widgetsStates[0].emptyData + ' </span>' +
        '<span class="symbolTicker showDetailsCurrency"></span>' +
        '</div>' +
        '<span class="market_cap_change_24hTicker cp-widget__rank">'+ widgetsStates[0].emptyData + '</span>' +
        '</div>';
    },
    widgetFooter: function(index){
      var currencyId = widgetsStates[index].currencyId;
      return '<p class="cp-widget__footer">' +
        'powered by ' +
        '<img style="width: 16px" src="'+ widgetFunctions.main_logo_link() +'" alt=""/>' +
        '<a target="_blank" href="'+ widgetFunctions.coin_link(currencyId) +'">coinpaprika.com</a>' +
        '</p>'
    },
    getImage: function(index){
      var data = widgetsStates[index];
      var imgContainers = data.mainElement.getElementsByClassName('cp-widget__img');
      for (var i = 0; i < imgContainers.length; i++){
        var imgContainer = imgContainers[i];
        imgContainer.classList.add('cp-widget__img--hidden');
        var img = imgContainer.querySelector('img');
        var newImg = new Image;
        newImg.onload = function() {
          img.src = this.src;
          imgContainer.classList.remove('cp-widget__img--hidden');
        };
        newImg.src = widgetFunctions.img_src(data.currencyId);
      }
    },
    img_src: function(id){
      return 'https://coinpaprika.com/coin/'+id+'/logo.png';
    },
    coin_link: function(id){
      return 'https://coinpaprika.com/coin/'+ id
    },
    main_logo_link: function(){
      return widgetDefaults.logo_src || widgetDefaults.origin_src +'/dist/img/logo_widget.svg'
    },
    getScriptElement: function(){
      return document.querySelector('script[data-cp-currency-widget]');
    },
  };
  
  function initWidgets(){
    if (!window.cpCurrencyWidgetsInitialized){
      window.cpCurrencyWidgetsInitialized = true;
      var mainElements = Array.prototype.slice.call(document.getElementsByClassName('coinpaprika-currency-widget'));
      var scriptElement = widgetFunctions.getScriptElement();
      if (scriptElement && scriptElement.dataset && scriptElement.dataset.cpCurrencyWidget){
        var dataset = JSON.parse(scriptElement.dataset.cpCurrencyWidget);
        if (Object.keys(dataset)){
          var keys = Object.keys(dataset);
          for (var j = 0; j < keys.length; j++){
            var key = keys[j].replace('-', '_');
            widgetDefaults[key] = dataset[keys[j]];
          }
        }
      }
      setTimeout(function(){
        widgetsStates = [];
        for(var i = 0; i < mainElements.length; i++){
          var newSettings = JSON.parse(JSON.stringify(widgetDefaults));
          console.log('widgetDefaults: ', widgetDefaults);
          newSettings.mainElement = mainElements[i];
          widgetsStates.push(newSettings);
          widgetFunctions.init(i);
        }
      }, 50);
    }
  }
  
  window.addEventListener('load', initWidgets, false);
  window.bindWidget = function(){
    window.cpCurrencyWidgetsInitialized = false;
    initWidgets();
  };
})();