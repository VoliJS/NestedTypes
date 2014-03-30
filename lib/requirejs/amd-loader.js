define(function() {
  // precompiled can be true indicating all resources have been compiled
  // or it can be an array of paths prefixes which are precompiled
  var precompiled;

  var loader = function(pluginId, ext, allowExts, compile) {
    if (arguments.length == 3) {
      compile = allowExts;
      allowExts = undefined;
    }
    else if (arguments.length == 2) {
      compile = ext;
      ext = allowExts = undefined;
    }

    return {
      buildCache: {},
      load: function(name, req, load, config) {
        var path = req.toUrl(name);
        var queryString = '';
        if (path.indexOf('?') != -1) {
          queryString = path.substr(path.indexOf('?'));
          path = path.substr(0, path.length - queryString.length);
        }

        // precompiled -> load from .ext.js extension
        if (config.precompiled instanceof Array) {
          for (var i = 0; i < config.precompiled.length; i++)
            if (path.substr(0, config.precompiled[i].length) == config.precompiled[i])
              return require([path + '.' + pluginId + '.js' + queryString], load, load.error);
        }
        else if (config.precompiled === true)
          return require([path + '.' + pluginId + '.js' + queryString], load, load.error);

        // only add extension if a moduleID not a path
        if (ext && name.substr(0, 1) != '/' && !name.match(/:\/\//)) {
          var validExt = false;
          if (allowExts) {
            for (var i = 0; i < allowExts.length; i++) {
              if (name.substr(name.length - allowExts[i].length - 1) == '.' + allowExts[i])
                validExt = true;
            }
          }
          if (!validExt)
            path += '.' + ext + queryString;
          else
            path += queryString;
        }
        else {
          path += queryString;
        }
      

        var self = this;
        
        loader.fetch(path, function(source) {
          compile(name, source, req, function(compiled) {
            if (typeof compiled == 'string') {
              if (config.isBuild)
                self.buildCache[name] = compiled;
              load.fromText(compiled);
            }
            else
              load(compiled);
          }, load.error, config);
        }, load.error);
      },
      write: function(pluginName, moduleName, write) {
        var compiled = this.buildCache[moduleName];
        if (compiled)
          write.asModule(pluginName + '!' + moduleName, compiled);
      },
      writeFile: function(pluginName, name, req, write) {
        write.asModule(pluginName + '!' + name, req.toUrl(name + '.' + pluginId + '.js'), this.buildCache[name]);
      }
    };
  }

  //loader.load = function(name, req, load, config) {
  //  load(loader);
  //}

  if (typeof window != 'undefined') {
    var progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'];
    var getXhr = function(path) {
      // check if same domain
      var sameDomain = true,
        domainCheck = /^(\w+:)?\/\/([^\/]+)/.exec(path);
      if (typeof window != 'undefined' && domainCheck) {
        sameDomain = domainCheck[2] === window.location.host;
        if (domainCheck[1])
          sameDomain &= domainCheck[1] === window.location.protocol;
      }

      // create xhr
      var xhr;
      if (typeof XMLHttpRequest !== 'undefined')
        xhr = new XMLHttpRequest();
      else {
        var progId;
        for (var i = 0; i < 3; i += 1) {
          progId = progIds[i];
          try {
            xhr = new ActiveXObject(progId);
          } 
          catch (e) {}

          if (xhr) {
            progIds = [progId];  // so faster next time
            break;
          }
        }
      }

      // use cors if necessary
      if (!sameDomain) {
        if (typeof XDomainRequest != 'undefined')
          xhr = new XDomainRequest();
        else if (!('withCredentials' in xhr))
          throw new Error('getXhr(): Cross Origin XHR not supported.');
      }

      if (!xhr)
        throw new Error('getXhr(): XMLHttpRequest not available');

      return xhr;
    };

    loader.fetch = function (url, callback, errback) {
      // get the xhr with CORS enabled if cross domain
      var xhr = getXhr(url);
      
      xhr.open('GET', url, !requirejs.inlineRequire);
      xhr.onreadystatechange = function(evt) {
        var status, err;
        //Do not explicitly handle errors, those should be
        //visible via console output in the browser.
        if (xhr.readyState === 4) {
          status = xhr.status;
          if (status > 399 && status < 600) {
            err = new Error(url + ' HTTP status: ' + status);
            err.xhr = xhr;
            if (errback)
              errback(err);
          }
          else {
            if (xhr.responseText == '')
              return errback(new Error(url + ' empty response'));
            callback(xhr.responseText);
          }
        }
      };
      xhr.send(null);
    }
  }
  else if (typeof process !== 'undefined' && process.versions && !!process.versions.node) {
    var fs = requirejs.nodeRequire('fs');
    loader.fetch = function(path, callback) {
      callback(fs.readFileSync(path, 'utf8'));
    }
  }
  else if (typeof Packages !== 'undefined') {
    loader.fetch = function(path, callback, errback) {
      var stringBuffer, line,
        encoding = 'utf-8',
        file = new java.io.File(path),
        lineSeparator = java.lang.System.getProperty('line.separator'),
        input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), encoding)),
        content = '';
      try {
        stringBuffer = new java.lang.StringBuffer();
        line = input.readLine();

        // Byte Order Mark (BOM) - The Unicode Standard, version 3.0, page 324
        // http://www.unicode.org/faq/utf_bom.html

        // Note that when we use utf-8, the BOM should appear as 'EF BB BF', but it doesn't due to this bug in the JDK:
        // http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4508058
        if (line && line.length() && line.charAt(0) === 0xfeff) {
          // Eat the BOM, since we've already found the encoding on this file,
          // and we plan to concatenating this buffer with others; the BOM should
          // only appear at the top of a file.
          line = line.substring(1);
        }

        stringBuffer.append(line);

        while ((line = input.readLine()) !== null) {
          stringBuffer.append(lineSeparator);
          stringBuffer.append(line);
        }
        //Make sure we return a JavaScript string and not a Java string.
        content = String(stringBuffer.toString()); //String
      } 
      catch(err) {
        if (errback)
          errback(err);
      }
      finally {
        input.close();
      }
      callback(content);
    }
  }
  else {
    loader.fetch = function() {
      throw new Error('Environment unsupported.');
    }
  }

  return loader;
});
