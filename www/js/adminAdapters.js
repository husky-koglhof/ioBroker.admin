function Adapters(main) {
    var that = this;

    this.curRepository =         null;
    this.curRepoLastUpdate =     null;
    this.curInstalled =          null;
    this.list = [];
    this.$grid =  $('#grid-adapters');
    this.main = main;
    this.tree = [];
    this.data = {};
    this.groupImages = {
        'common adapters_group':  '/img/common.png',
        'hardware_group':         '/img/hardware.png',
        'script_group':           '/img/script.png',
        'media_group':            '/img/media.png',
        'communication_group':    '/img/communication.png',
        'visualisation_group':    '/img/visualisation.png',
        'storage_group':          '/img/storage.png',
        'weather_group':          '/img/weather.png',
        'schedule_group':         '/img/schedule.png',
        'vis_group':              '/img/vis.png',
        'service_group':          '/img/service.png'
    };

    this.isList        = false;
    this.filterVals    = {length: 0};
    this.onlyInstalled = false;
    this.onlyUpdatable = false;
    this.currentFilter = '';
    this.isCollapsed   = {};

    this.types = {
        "hmm":          "hardware",
        "occ":          "schedule",
        "artnet":       "hardware"
    };
    
    this.prepare = function () {
        that.$grid.fancytree({
            extensions: ["table", "gridnav", "filter", "themeroller"],
            checkbox: false,
            table: {
                indentation: 20      // indent 20px per node level
            },
            source: that.tree,
            renderColumns: function(event, data) {
                var node = data.node;
                var $tdList = $(node.tr).find(">td");

                if (!that.data[node.key]) {
                    $tdList.eq(0).css({'font-weight': 'bold'});
                    //$(node.tr).addClass('ui-state-highlight');

                    // Calculate total count of adapter and count of installed adapter
                    for (var c = 0; c < that.tree.length; c++) {
                        if (that.tree[c].key == node.key) {
                            $tdList.eq(1).html(that.tree[c].desc).css({'overflow': 'hidden', "white-space": "nowrap", position: 'relative'});
                            var installed = 0;
                            for (var k = 0; k < that.tree[c].children.length; k++) {
                                if (that.data[that.tree[c].children[k].key].installed) installed++;
                            }
                            var title;
                            if (!that.onlyInstalled && !that.onlyUpdatable) {
                                title = '[<span title="' + _('Installed from group') + '">' + installed + '</span> / <span title="' + _('Total count in group') + '">' + that.tree[c].children.length + '</span>]';
                            } else {
                                title = '<span title="' + _('Installed from group') + '">' + installed + '</span>';
                            }
                            $tdList.eq(4).html(title).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap"});
                            break;
                        }
                    }
                    return;
                }
                $tdList.eq(0).css({'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(1).html(that.data[node.key].desc).css({'overflow': 'hidden', "white-space": "nowrap", position: 'relative', 'font-weight': that.data[node.key].bold ? 'bold' : null});
                $tdList.eq(2).html(that.data[node.key].keywords).css({'overflow': 'hidden', "white-space": "nowrap"}).attr('title', that.data[node.key].keywords);

                $tdList.eq(3).html(that.data[node.key].version).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap", position: 'relative'});
                $tdList.eq(4).html(that.data[node.key].installed).css({'padding-left': '10px', 'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(5).html(that.data[node.key].platform).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(6).html(that.data[node.key].license).css({'text-align': 'center', 'overflow': 'hidden', "white-space": "nowrap"});
                $tdList.eq(7).html(that.data[node.key].install).css({'text-align': 'center'});
                that.initButtons(node.key);
                // If we render this element, that means it is expanded
                if (that.isCollapsed[that.data[node.key].group]) {
                    that.isCollapsed[that.data[node.key].group] = false;
                    that.main.saveConfig('adaptersIsCollapsed', JSON.stringify(that.isCollapsed));
                }
            },
            gridnav: {
                autofocusInput:   false,
                handleCursorKeys: true
            },
            filter: {
                mode: "hide",
                autoApply: true
            },
            collapse: function(event, data) {
                if (that.isCollapsed[data.node.key]) return;
                that.isCollapsed[data.node.key] = true;
                that.main.saveConfig('adaptersIsCollapsed', JSON.stringify(that.isCollapsed));
            }
        });

        $('#btn_collapse_adapters').button({icons: {primary: 'ui-icon-folder-collapsed'}, text: false}).css({width: 18, height: 18}).unbind('click').click(function () {
            $('#process_running_adapters').show();
            setTimeout(function () {
                that.$grid.fancytree('getRootNode').visit(function (node) {
                    if (!that.filterVals.length || node.match || node.subMatch) node.setExpanded(false);
                });
                $('#process_running_adapters').hide();
            }, 100);
        });

        $('#btn_expand_adapters').button({icons: {primary: 'ui-icon-folder-open'}, text: false}).css({width: 18, height: 18}).unbind('click').click(function () {
            $('#process_running_adapters').show();
            setTimeout(function () {
                that.$grid.fancytree('getRootNode').visit(function (node) {
                    if (!that.filterVals.length || node.match || node.subMatch)
                        node.setExpanded(true);
                });
                $('#process_running_adapters').hide();
            }, 100);
        });

        $('#btn_list_adapters').button({icons: {primary: 'ui-icon-grip-dotted-horizontal'}, text: false}).css({width: 18, height: 18}).unbind('click').click(function () {
            $('#process_running_adapters').show();
            that.isList = !that.isList;
            if (that.isList) {
                $('#btn_list_adapters').addClass('ui-state-error');
                $('#btn_expand_adapters').hide();
                $('#btn_collapse_adapters').hide();
                $(this).attr('title', _('list'));
            } else {
                $('#btn_list_adapters').removeClass('ui-state-error');
                $('#btn_expand_adapters').show();
                $('#btn_collapse_adapters').show();
                $(this).attr('title', _('tree'));
            }
            that.main.saveConfig('adaptersIsList', that.isList);
            $('#process_running_adapters').show();

            setTimeout(function () {
                that.init(true);
                $('#process_running_adapters').hide();
            }, 200);
        });

        $('#btn_filter_adapters').button({icons: {primary: 'ui-icon-star'}, text: false}).css({width: 18, height: 18}).unbind('click').click(function () {
            $('#process_running_adapters').show();
            that.onlyInstalled = !that.onlyInstalled;
            if (that.onlyInstalled) {
                $('#btn_filter_adapters').addClass('ui-state-error');
            } else {
                $('#btn_filter_adapters').removeClass('ui-state-error');
            }
            that.main.saveConfig('adaptersOnlyInstalled', that.onlyInstalled);

            setTimeout(function () {
                that.init(true);
                $('#process_running_adapters').hide();
            }, 200);
        });

        $('#btn_filter_updates').button({icons: {primary: 'ui-icon-info'}, text: false}).css({width: 18, height: 18}).unbind('click').click(function () {
            $('#process_running_adapters').show();
            that.onlyUpdatable = !that.onlyUpdatable;
            if (that.onlyUpdatable) {
                $('#btn_filter_updates').addClass('ui-state-error');
            } else {
                $('#btn_filter_updates').removeClass('ui-state-error');
            }
            that.main.saveConfig('adaptersOnlyUpdatable', that.onlyUpdatable);

            setTimeout(function () {
                that.init(true);
                $('#process_running_adapters').hide();
            }, 200);
        });

        $('#btn_filter_custom_url').button({icons: {primary: 'ui-icon-tag'}, text: false}).css({width: 18, height: 18}).unbind('click').click(function () {
            $('#dialog-install-url').dialog({
                autoOpen:   true,
                modal:      true,
                width:      600,
                height:     170,
                buttons:    [
                    {
                        id: 'dialog-install-url-button',
                        text: _('Install'),
                        click: function () {
                            $('#dialog-install-url').dialog('close');
                            var url   = $('#install-url-link').val();
                            var debug = $('#install-url-debug').prop('checked') ? ' --debug' : '';
                            if (!url) {
                                that.main.showError(_('Invalid link'));
                                return;
                            }
                            that.main.cmdExec(null, 'url "' + url + '"' + debug, function (exitCode) {
                                if (!exitCode) that.init(true, true);
                            });
                        }
                    },
                    {
                        text: _('Cancel'),
                        click: function () {
                            $('#dialog-install-url').dialog('close');
                        }
                    }
                ]
            });
        });
        $('#install-url-link').keyup(function (event) {
            if (event.which == 13) {
                $('#dialog-install-url-button').trigger('click');
            }
        });

        // Load settings
        that.isList = that.main.config.adaptersIsList || false;
        that.onlyInstalled = that.main.config.adaptersOnlyInstalled || false;
        that.onlyUpdatable = that.main.config.adaptersOnlyUpdatable || false;
        that.currentFilter = that.main.config.adaptersCurrentFilter || '';
        that.isCollapsed = that.main.config.adaptersIsCollapsed ? JSON.parse(that.main.config.adaptersIsCollapsed) : {};
        $('#adapters-filter').val(that.currentFilter)

        if (that.isList) {
            $('#btn_list_adapters').addClass('ui-state-error');
            $('#btn_expand_adapters').hide();
            $('#btn_collapse_adapters').hide();
            $('#btn_list_adapters').attr('title', _('tree'));
        }

        if (that.onlyInstalled) $('#btn_filter_adapters').addClass('ui-state-error');
        if (that.onlyUpdatable) $('#btn_filter_updates').addClass('ui-state-error');

        $('#btn_refresh_adapters').button({icons: {primary: 'ui-icon-refresh'}, text: false}).css({width: 18, height: 18}).click(function () {
            that.init(true, true);
        });


        // add filter processing
        $('#adapters-filter').keyup(function () {
            $(this).trigger('change');
        }).on('change', function () {
            if (that.filterTimer) {
                clearTimeout(that.filterTimer);
            }
            that.filterTimer = setTimeout(function () {
                that.filterTimer = null;
                that.currentFilter = $('#adapters-filter').val();
                that.main.saveConfig('adaptersCurrentFilter', that.currentFilter);
                that.$grid.fancytree('getTree').filterNodes(customFilter, false);
            }, 400);
        })

        $('#adapters-filter-clear').button({icons: {primary: 'ui-icon-close'}, text: false}).css({width: 16, height: 16}).click(function () {
            $('#adapters-filter').val('').trigger('change');
        });
    };

    function customFilter(node) {
        //if (node.parent && node.parent.match) return true;

        if (that.currentFilter) {
             if (!that.data[node.key]) return false;

             if ((that.data[node.key].name && that.data[node.key].name.toLowerCase().indexOf(that.currentFilter) != -1) ||
                 (that.data[node.key].title && that.data[node.key].title.toLowerCase().indexOf(that.currentFilter) != -1) ||
                 (that.data[node.key].keywords && that.data[node.key].keywords.toLowerCase().indexOf(that.currentFilter) != -1) ||
                 (that.data[node.key].desc && that.data[node.key].desc.toLowerCase().indexOf(that.currentFilter) != -1)){
                return true;
             } else {
                 return false;
             }
        } else {
            return true;
        }
    }

    this.getAdaptersInfo = function (host, update, updateRepo, callback) {
        if (!host) {
            return;
        }
        if (!callback) throw 'Callback cannot be null or undefined';
        if (update) {
            // Do not update too offten
            if (!this.curRepoLastUpdate || ((new Date()).getTime() - this.curRepoLastUpdate > 1000)) {
                this.curRepository = null;
                this.curInstalled  = null;
            }
        }
        if (!this.curRepository) {
            this.main.socket.emit('sendToHost', host, 'getRepository', {repo: this.main.systemConfig.common.activeRepo, update: updateRepo}, function (_repository) {
                if (_repository === 'permissionError') {
                    console.error('May not read "getRepository"');
                    _repository = {};
                }
                that.curRepository = _repository;
                if (that.curRepository && that.curInstalled) {
                    that.curRepoLastUpdate = (new Date()).getTime();
                    setTimeout(function () {
                        callback(that.curRepository, that.curInstalled);
                    }, 0);
                }
            });
        }
        if (!this.curInstalled) {
            this.main.socket.emit('sendToHost', host, 'getInstalled', null, function (_installed) {
                if (_installed === 'permissionError') {
                    console.error('May not read "getInstalled"');

                    _installed = {};
                }
                that.curInstalled = _installed;
                if (that.curRepository && that.curInstalled) {
                    that.curRepoLastUpdate = (new Date()).getTime();
                    setTimeout(function () {
                        callback(that.curRepository, that.curInstalled);
                    }, 0);
                }
            });
        }
        if (this.curInstalled && this.curRepository) {
            setTimeout(function () {
                callback(that.curRepository, that.curInstalled);
            }, 0);
        }
    };

    this.resize = function (width, height) {
        $('#grid-adapters-div').height($(window).height() - $('#tabs .ui-tabs-nav').height() - 50);
    };

    this.enableColResize = function () {
        if (!$.fn.colResizable) return;
        if (this.$grid.is(':visible')) {
            this.$grid.colResizable({liveDrag: true});
        } /*else {
            setTimeout(function () {
                enableColResize();
            }, 1000);
        }*/
    };

    // ----------------------------- Adapters show and Edit ------------------------------------------------
    this.init = function (update, updateRepo) {
        if (!this.main.objectsLoaded) {
            setTimeout(function () {
                that.init();
            }, 250);
            return;
        }

        if (typeof this.$grid !== 'undefined' && (!this.$grid[0]._isInited || update)) {
            this.$grid[0]._isInited = true;

            $('#process_running_adapters').show();

            this.$grid.find('tbody').html('');

            this.getAdaptersInfo(this.main.currentHost, update, updateRepo, function (repository, installedList) {
                var id = 1;
                var obj;
                var version;
                var tmp;
                var adapter;

                var listInstalled = [];
                var listUnsinstalled = [];

                if (installedList) {
                    for (adapter in installedList) {
                        obj = installedList[adapter];
                        if (!obj || obj.controller || adapter == 'hosts') continue;
                        listInstalled.push(adapter);
                    }
                    listInstalled.sort();
                }

                // List of adapters for repository
                for (adapter in repository) {
                    obj = repository[adapter];
                    if (!obj || obj.controller) continue;
                    version = '';
                    if (installedList && installedList[adapter]) continue;
                    listUnsinstalled.push(adapter);
                }
                listUnsinstalled.sort();

                that.tree = [];
                that.data = {};

                // list of the installed adapters
                for (var i = 0; i < listInstalled.length; i++) {
                    adapter = listInstalled[i];
                    obj = installedList ? installedList[adapter] : null;
                    if (!obj || obj.controller || adapter == 'hosts') continue;
                    var installed = '';
                    var icon = obj.icon;
                    version = '';

                    if (repository[adapter] && repository[adapter].version) version = repository[adapter].version;

                    if (repository[adapter] && repository[adapter].extIcon) icon = repository[adapter].extIcon;

                    if (obj.version) {
                        installed = '<table style="border: 0px;border-collapse: collapse;" cellspacing="0" cellpadding="0" class="ui-widget"><tr><td style="border: 0px;padding: 0;width:50px">' + obj.version + '</td>';

                        var _instances = 0;
                        var _enabled   = 0;

                        // Show information about installed and enabled instances
                        for (var z = 0; z < that.main.instances.length; z++) {
                            if (main.objects[that.main.instances[z]].common.name == adapter) {
                                _instances++;
                                if (main.objects[that.main.instances[z]].common.enabled) _enabled++;
                            }
                        }
                        if (_instances) {
                            installed += '<td style="border: 0px;padding: 0;width:40px">[<span title="' + _('Installed instances') + '">' + _instances + '</span>';
                            if (_enabled) installed += '/<span title="' + _('Active instances') + '" style="color: green">' + _enabled + '</span>';
                            installed += ']</td>';
                        } else {
                            installed += '<td style="border: 0px;padding: 0;width:40px"></td>';
                        }

                        tmp = installed.split('.');
                        if (!that.main.upToDate(version, obj.version)) {
                            installed += '<td style="border: 0px;padding: 0;width:30px"><button class="adapter-update-submit" data-adapter-name="' + adapter + '">' + _('update') + '</button></td>';
                            version = version.replace('class="', 'class="updateReady ');
                            $('a[href="#tab-adapters"]').addClass('updateReady');
                        } else if (that.onlyUpdatable) {
                            continue;
                        }

                        installed += '</tr></table>';
                    }
                    if (version) {
                        tmp = version.split('.');
                        if (tmp[0] === '0' && tmp[1] === '0' && tmp[2] === '0') {
                            version = '<span class="planned" title="' + _("planned") + '">' + version + '</span>';
                        } else if (tmp[0] === '0' && tmp[1] === '0') {
                            version = '<span class="alpha" title="' + _("alpha") + '">' + version + '</span>';
                        } else if (tmp[0] === '0') {
                            version = '<span class="beta" title="' + _("beta") + '">' + version + '</span>';
                        } else {
                            version = '<span class="stable" title="' + _("stable") + '">' + version + '</span>';
                        }
                    }

                    var group = (obj.type || that.types[adapter] || 'common adapters') + '_group';
                    var desc  = (typeof obj.desc === 'object') ? (obj.desc[systemLang] || obj.desc.en) : obj.desc;
                    desc += showUploadProgress(group, adapter, that.main.states['system.adapter.' + adapter + '.upload'] ? that.main.states['system.adapter.' + adapter + '.upload'].val : 0);

                    if (adapter == 'vis') {
                        //todo
                        obj.highlight = true;
                    }

                    that.data[adapter] = {
                        image:      icon ? '<img src="' + icon + '" width="22px" height="22px" />' : '',
                        name:       adapter,
                        title:      obj.title,
                        desc:       desc,
                        keywords:   obj.keywords ? obj.keywords.join(' ') : '',
                        version:    version,
                        installed:  installed,
                        bold:       obj.highlight,
                        install: '<button data-adapter-name="' + adapter + '" class="adapter-install-submit">' + _('add instance') + '</button>' +
                            '<button ' + (obj.readme ? '' : 'disabled="disabled" ') + 'data-adapter-name="' + adapter + '" data-adapter-url="' + obj.readme + '" class="adapter-readme-submit">' + _('readme') + '</button>' +
                            '<button ' + (installed ? '' : 'disabled="disabled" ') + 'data-adapter-name="' + adapter + '" class="adapter-delete-submit">' + _('delete adapter') + '</button>',
                        platform:   obj.platform,
                        group:      group,
                        license:    obj.license || '',
                        licenseUrl: obj.licenseUrl || ''
                    };

                    if (!obj.type) console.log('"' + adapter + '": "common adapters",');
                    if (obj.type && that.types[adapter]) console.log('Adapter "' + adapter + '" has own type. Remove from admin.');

                    if (!that.isList) {
                        var igroup = -1;
                        for (var j = 0; j < that.tree.length; j++){
                            if (that.tree[j].key == that.data[adapter].group) {
                                igroup = j;
                                break;
                            }
                        }
                        if (igroup < 0) {
                            that.tree.push({
                                title:    _(that.data[adapter].group),
                                desc:     showUploadProgress(group),
                                key:      that.data[adapter].group,
                                folder:   true,
                                expanded: !that.isCollapsed[that.data[adapter].group],
                                children: [],
                                icon:     that.groupImages[that.data[adapter].group]
                            });
                            igroup = that.tree.length - 1;
                        }
                        that.tree[igroup].children.push({
                            icon:     icon,
                            title:    that.data[adapter].title || adapter,
                            key:      adapter
                        });
                    } else {
                        that.tree.push({
                            icon:     icon,
                            title:    that.data[adapter].title || adapter,
                            key:      adapter
                        });
                    }
                }

                if (!that.onlyInstalled && !that.onlyUpdatable) {
                    for (i = 0; i < listUnsinstalled.length; i++) {
                        adapter = listUnsinstalled[i];

                        obj = repository[adapter];
                        if (!obj || obj.controller) continue;
                        version = '';
                        if (installedList && installedList[adapter]) continue;

                        if (repository[adapter] && repository[adapter].version) {
                            version = repository[adapter].version;
                            tmp = version.split('.');
                            if (tmp[0] === '0' && tmp[1] === '0' && tmp[2] === '0') {
                                version = '<span class="planned" title="' + _("planned") + '">' + version + '</span>';
                            } else if (tmp[0] === '0' && tmp[1] === '0') {
                                version = '<span class="alpha" title="' + _("alpha") + '">' + version + '</span>';
                            } else if (tmp[0] === '0') {
                                version = '<span class="beta" title="' + _("beta") + '">' + version + '</span>';
                            } else {
                                version = '<span class="stable" title="' + _("stable") + '">' + version + '</span>';
                            }
                        }

                        var group = (obj.type || that.types[adapter] || 'common adapters') + '_group';
                        var desc = (typeof obj.desc === 'object') ? (obj.desc[systemLang] || obj.desc.en) : obj.desc;
                        desc += showUploadProgress(adapter, that.main.states['system.adapter.' + adapter + '.upload'] ? that.main.states['system.adapter.' + adapter + '.upload'].val : 0);

                        that.data[adapter] = {
                            image:      repository[adapter].extIcon ? '<img src="' + repository[adapter].extIcon + '" width="22px" height="22px" />' : '',
                            name:       adapter,
                            title:      obj.title,
                            desc:       desc,
                            keywords:   obj.keywords ? obj.keywords.join(' ') : '',
                            version:    version,
                            bold:       obj.highlight,
                            installed:  '',
                            install: '<button data-adapter-name="' + adapter + '" class="adapter-install-submit">' + _('add instance') + '</button>' +
                                     '<button ' + (obj.readme ? '' : 'disabled="disabled" ') + ' data-adapter-name="' + adapter + '" data-adapter-url="' + obj.readme + '" class="adapter-readme-submit">' + _('readme') + '</button>' +
                                     '<button disabled="disabled" data-adapter-name="' + adapter + '" class="adapter-delete-submit">' + _('delete adapter') + '</button>',
                            platform:   obj.platform,
                            license:    obj.license || '',
                            licenseUrl: obj.licenseUrl || '',
                            group:      group
                        };

                        if (!obj.type) console.log('"' + adapter + '": "common adapters",');
                        if (obj.type && that.types[adapter]) console.log('Adapter "' + adapter + '" has own type. Remove from admin.');

                        if (!that.isList) {
                            var igroup = -1;
                            for (var j = 0; j < that.tree.length; j++){
                                if (that.tree[j].key == that.data[adapter].group) {
                                    igroup = j;
                                    break;
                                }
                            }
                            if (igroup < 0) {
                                that.tree.push({
                                    title:    _(that.data[adapter].group),
                                    key:      that.data[adapter].group,
                                    folder:   true,
                                    expanded: !that.isCollapsed[that.data[adapter].group],
                                    children: [],
                                    icon:     that.groupImages[that.data[adapter].group]
                                });
                                igroup = that.tree.length - 1;
                            }
                            that.tree[igroup].children.push({
                                title:    that.data[adapter].title || adapter,
                                icon:     repository[adapter].extIcon,
                                desc:     showUploadProgress(group),
                                key:      adapter
                            });
                        } else {
                            that.tree.push({
                                icon:     repository[adapter].extIcon,
                                title:    that.data[adapter].title || adapter,
                                key:      adapter
                            });
                        }
                    }
                }

                that.$grid.fancytree('getTree').reload(that.tree);
                $('#grid-adapters .fancytree-icon').each(function () {
                    if ($(this).attr('src')) $(this).css({width: 22, height: 22});

                    $(this).hover(function () {
                        var text = '<div class="icon-large" style="' +
                            'left: ' + Math.round($(this).position().left + $(this).width() + 5) + 'px;"><img src="' + $(this).attr('src') + '"/></div>';
                        var $big = $(text);
                        $big.insertAfter($(this));
                        $(this).data('big', $big[0]);
                        var h = parseFloat($big.height());
                        var top = Math.round($(this).position().top - ((h - parseFloat($(this).height())) / 2));
                        if (h + top > (window.innerHeight || document.documentElement.clientHeight)) {
                            top = (window.innerHeight || document.documentElement.clientHeight) - h;
                        }
                        $big.css({top: top});

                    }, function () {
                        var big = $(this).data('big');
                        $(big).remove();
                        $(this).data('big', undefined);
                    });
                });
                $('#process_running_adapters').hide();
                if (that.currentFilter) that.$grid.fancytree('getTree').filterNodes(customFilter, false);

                that.enableColResize();
            });
        }
    };

    function showLicenseDialog(adapter, callback) {
        var $dialogLicense = $('#dialog-license');
        // Is adapter installed
        if (that.data[adapter].installed || !that.data[adapter].licenseUrl) {
            callback(true);
            return;
        }
        $('#license_language').hide();
        $('#license_diag').hide();
        $('#license_language_label').hide();
        $('#license_checkbox').hide();

        var timeout = setTimeout(function () {
            timeout = null;
            callback(true);
        }, 10000);

        // Workaround
        // https://github.com/ioBroker/ioBroker.vis/blob/master/LICENSE =>
        // https://raw.githubusercontent.com/ioBroker/ioBroker.vis/master/LICENSE
        if (that.data[adapter].licenseUrl.indexOf('github.com') != -1) {
            that.data[adapter].licenseUrl = that.data[adapter].licenseUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        }

        that.main.socket.emit('httpGet', that.data[adapter].licenseUrl, function (error, response, body) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;

                if (!error && body) {
                    $dialogLicense.css({'z-index': 200});
                    $('#license_text').html('<pre>' + body + '</pre>');
                    $dialogLicense.dialog({
                        autoOpen: true,
                        modal: true,
                        width: 600,
                        height: 400,
                        buttons: [
                            {
                                text: _('agree'),
                                click: function () {
                                    $dialogLicense.dialog('close');
                                    callback(true);
                                }
                            },
                            {
                                text: _('not agree'),
                                click: function () {
                                    $dialogLicense.dialog('close');
                                    callback(false);
                                }
                            }
                        ],
                        close: function () {
                            callback(false);
                        }
                    });
                } else {
                    callback(true);
                }
            }
        });
    }

    this.initButtons = function (adapter) {
        $('.adapter-install-submit[data-adapter-name="' + adapter + '"]').button({
            text: false,
            icons: {
                primary: 'ui-icon-plusthick'
            }
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            var adapter = $(this).attr('data-adapter-name');
            that.getAdaptersInfo(that.main.currentHost, false, false, function (repo, installed) {
                var obj = repo[adapter];

                if (!obj) obj = installed[adapter];

                if (!obj) return;

                if (obj.license && obj.license !== 'MIT') {
                    // Show license dialog!
                    showLicenseDialog(adapter, function (isAgree) {
                        if (isAgree) {
                            that.main.cmdExec(null, 'add ' + adapter, function (exitCode) {
                                if (!exitCode) that.init(true);
                            });
                        }
                    });
                } else {
                    that.main.cmdExec(null, 'add ' + adapter, function (exitCode) {
                        if (!exitCode) that.init(true);
                    });
                }
            });
        });

        $('.adapter-delete-submit[data-adapter-name="' + adapter + '"]').button({
            icons: {primary: 'ui-icon-trash'},
            text:  false
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            var name = $(this).attr('data-adapter-name');
            that.main.confirmMessage(_('Are you sure?'), _('Question'), 'help', function (result) {
                if (result) {
                    that.main.cmdExec(null, 'del ' + name, function (exitCode) {
                        if (!exitCode) that.init(true);
                    });
                }
            });
        });

        $('.adapter-readme-submit[data-adapter-name="' + adapter + '"]').button({
            icons: {primary: 'ui-icon-help'},
            text: false
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            window.open($(this).attr('data-adapter-url'), $(this).attr('data-adapter-name') + ' ' + _('readme'));
        });

        $('.adapter-update-submit[data-adapter-name="' + adapter + '"]').button({
            icons: {primary: 'ui-icon-refresh'},
            text:  false
        }).css('width', '22px').css('height', '18px').unbind('click').on('click', function () {
            var aName = $(this).attr('data-adapter-name');
            if (aName == 'admin') that.main.waitForRestart = true;

            that.main.cmdExec(null, 'upgrade ' + aName, function (exitCode) {
                if (!exitCode) that.init(true);
            });
        });
    };

    this.objectChange = function (id, obj) {
        // Update Adapter Table
        if (id.match(/^system\.adapter\.[a-zA-Z0-9-_]+$/)) {
            if (obj) {
                if (this.list.indexOf(id) == -1) this.list.push(id);
            } else {
                var j = this.list.indexOf(id);
                if (j != -1) {
                    this.list.splice(j, 1);
                }
            }

            if (typeof this.$grid != 'undefined' && this.$grid[0]._isInited) {
                this.init(true);
            }
        }
    };

    function showUploadProgress(group, adapter, percent) {
        var text = '';
        if (adapter || typeof group === 'string') {
            if (adapter) {
                text += '<div class="adapter-upload-progress" data-adapter-name="' + adapter + '"';
            } else {
                text += '<div class="group-upload-progress"';
            }
            text += ' data-adapter-group="' + group + '" style="position: absolute; width: 100%; height: 100%; opacity: ' + (percent ? 0.7 : 0) + '; top: 0; left: 0">';
        } else {
            percent = group;
        }
        text += percent ? '<table title="' + _('Upload') + ' ' + percent + '%" class="no-space" style="width:100%; height: 100%; opacity: 0.7"><tr style="height: 100%" class="no-space"><td class="no-space" style="width:' + percent + '%;background: blue"></td><td style="width:' + (100 - percent) + '%;opacity: 0.1" class="no-space"></td></tr></table>' : '';

        if (adapter) text += '</div>';
        return text;
    }

    this.stateChange = function (id, state) {
        if (id && state) {
            var adapter = id.match(/^system\.adapter\.([\w\d-]+)\.upload$/);
            if (adapter) {
                var $adapter = $('.adapter-upload-progress[data-adapter-name="' + adapter[1] + '"]');
                var text = showUploadProgress(state.val);
                $adapter.html(text).css({opacity: state.val ? 0.7 : 0});
                $('.group-upload-progress[data-adapter-group="' + $adapter.data('adapter-group') + '"]').html(text).css({opacity: state.val ? 0.7 : 0});
            }
        }
    };
}
