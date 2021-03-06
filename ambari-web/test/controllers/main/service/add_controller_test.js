/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var App = require('app');
require('controllers/wizard');
require('controllers/main/service/add_controller');
var addServiceController = null;

describe('App.AddServiceController', function() {

  beforeEach(function () {
    addServiceController = App.AddServiceController.create({});
  });

  describe('#installAdditionalClients', function() {

    var t = {
      additionalClients: {
        componentName: "TEZ_CLIENT",
        hostNames: ["hostName1", "hostName2"]
      },
      additionalClientsWithoutHosts: {
        componentName: "TEZ_CLIENT",
        hostNames: []
      },
      RequestInfo: {
        "context": Em.I18n.t('requestInfo.installHostComponent') + ' ' + App.format.role("TEZ_CLIENT"),
        "query": "HostRoles/component_name=TEZ_CLIENT&HostRoles/host_name.in(hostName1,hostName2)"
      },
      Body: {
        HostRoles: {
          state: 'INSTALLED'
        }
      }
    };

    beforeEach(function () {
      sinon.spy($, 'ajax');
      sinon.stub(App, 'get', function(k) {
        if ('clusterName' === k) return 'tdk';
        return Em.get(App, k);
      });
      addServiceController.set('installClietsQueue', App.ajaxQueue.create())
    });

    afterEach(function () {
      $.ajax.restore();
      App.get.restore();
    });

    it('send request to install client', function () {
      addServiceController.set("content.additionalClients", [t.additionalClients]);
      addServiceController.installAdditionalClients();
      expect($.ajax.calledOnce).to.equal(true);

      expect(JSON.parse($.ajax.args[0][0].data).Body).to.deep.eql(t.Body);
      expect(JSON.parse($.ajax.args[0][0].data).RequestInfo).to.eql(t.RequestInfo);
    });

    it('should not send request to install client', function () {
      addServiceController.set("content.additionalClients", [t.additionalClientsWithoutHosts]);
      expect($.ajax.called).to.be.false;
    });

  });

  describe('#generateDataForInstallServices', function() {
    var tests = [{
      selected: ["YARN","HBASE"],
      res: {
        "context": Em.I18n.t('requestInfo.installServices'),
        "ServiceInfo": {"state": "INSTALLED"},
        "urlParams": "ServiceInfo/service_name.in(YARN,HBASE)"
      }
    },
    {
      selected: ['OOZIE'],
      res: {
        "context": Em.I18n.t('requestInfo.installServices'),
        "ServiceInfo": {"state": "INSTALLED"},
        "urlParams": "ServiceInfo/service_name.in(OOZIE,HDFS,YARN,MAPREDUCE2)"
      }
    }];
    tests.forEach(function(t){
      it('should generate data with ' + t.selected.join(","), function () {
        expect(addServiceController.generateDataForInstallServices(t.selected)).to.be.eql(t.res);
      });
    });
  });

  describe('#saveServices', function() {
    beforeEach(function() {
      sinon.stub(addServiceController, 'setDBProperty', Em.K);
    });

    afterEach(function() {
      addServiceController.setDBProperty.restore();
    });

    var tests = [
      {
        appService: [
          Em.Object.create({ serviceName: 'HDFS' }),
          Em.Object.create({ serviceName: 'KERBEROS' })
        ],
        stepCtrlContent: Em.Object.create({
          content: Em.A([
            Em.Object.create({ serviceName: 'HDFS', isInstalled: true, isSelected: true }),
            Em.Object.create({ serviceName: 'YARN', isInstalled: false, isSelected: true })
          ])
        }),
        e: {
          selected: ['YARN'],
          installed: ['HDFS', 'KERBEROS']
        }
      },
      {
        appService: [
          Em.Object.create({ serviceName: 'HDFS' }),
          Em.Object.create({ serviceName: 'STORM' })
        ],
        stepCtrlContent: Em.Object.create({
          content: Em.A([
            Em.Object.create({ serviceName: 'HDFS', isInstalled: true, isSelected: true }),
            Em.Object.create({ serviceName: 'YARN', isInstalled: false, isSelected: true }),
            Em.Object.create({ serviceName: 'MAPREDUCE2', isInstalled: false, isSelected: true })
          ])
        }),
        e: {
          selected: ['YARN', 'MAPREDUCE2'],
          installed: ['HDFS', 'STORM']
        }
      }
    ];

    var message = '{0} installed, {1} selected. Installed list should be {2} and selected - {3}';
    tests.forEach(function(test) {
      var installed = test.appService.mapProperty('serviceName');
      var selected = test.stepCtrlContent.get('content').filterProperty('isSelected', true)
        .filterProperty('isInstalled', false).mapProperty('serviceName');
      it(message.format(installed, selected, test.e.installed, test.e.selected), function() {
        sinon.stub(App.Service, 'find').returns(test.appService);
        addServiceController.saveServices(test.stepCtrlContent);
        App.Service.find.restore();
        var savedServices = addServiceController.setDBProperty.withArgs('services').args[0][1];
        expect(savedServices.selectedServices).to.have.members(test.e.selected);
        expect(savedServices.installedServices).to.have.members(test.e.installed);
      });
    });
  });

  describe('#loadHosts', function () {

    var cases = [
      {
        hosts: {},
        isAjaxRequestSent: false,
        title: 'hosts are already loaded'
      },
      {
        areHostsLoaded: false,
        isAjaxRequestSent: true,
        title: 'hosts aren\'t yet loaded'
      }
    ];

    beforeEach(function () {
      sinon.stub(App.ajax, 'send', function () {
        return {
          promise: Em.K
        };
      });
    });

    afterEach(function () {
      addServiceController.getDBProperty.restore();
      App.ajax.send.restore();
    });

    cases.forEach(function (item) {
      it(item.title, function () {
        sinon.stub(addServiceController, 'getDBProperty').withArgs('hosts').returns(item.hosts);
        addServiceController.loadHosts();
        expect(App.ajax.send.calledOnce).to.equal(item.isAjaxRequestSent);
      });
    });

  });

  describe('#loadHostsSuccessCallback', function () {

    it('should load hosts to local db and model', function () {
      var diskInfo = [
          {
            available: '600000',
            used: '400000',
            percent: '40%',
            size: '10000000',
            type: 'ext4',
            mountpoint: '/'
          },
          {
            available: '500000',
            used: '300000',
            percent: '50%',
            size: '6000000',
            type: 'ext4',
            mountpoint: '/'
          }
        ],
        hostComponents = [
          [
            {
              HostRoles: {
                component_name: 'c0',
                state: 'STARTED'
              }
            },
            {
              HostRoles: {
                component_name: 'c1',
                state: 'INSTALLED'
              }
            }
          ],
          [
            {
              HostRoles: {
                component_name: 'c2',
                state: 'STARTED'
              }
            },
            {
              HostRoles: {
                component_name: 'c3',
                state: 'INSTALLED'
              }
            }
          ]
        ],
        response = {
          items: [
            {
              Hosts: {
                cpu_count: 1,
                disk_info: [
                  diskInfo[0]
                ],
                host_name: 'h0',
                ip: '10.1.1.0',
                os_arch: 'x86_64',
                os_type: 'centos6',
                total_mem: 4194304
              },
              host_components: hostComponents[0]
            },
            {
              Hosts: {
                cpu_count: 2,
                disk_info: [
                  diskInfo[1]
                ],
                host_name: 'h1',
                ip: '10.1.1.1',
                os_arch: 'x86',
                os_type: 'centos5',
                total_mem: 3145728
              },
              host_components: hostComponents[1]
            }
          ]
        },
        expected = {
          h0: {
            name: 'h0',
            cpu: 1,
            memory: 4194304,
            disk_info: [diskInfo[0]],
            osType: 'centos6',
            osArch: 'x86_64',
            ip: '10.1.1.0',
            bootStatus: 'REGISTERED',
            isInstalled: true,
            hostComponents: hostComponents[0],
            id: 0
          },
          h1: {
            name: 'h1',
            cpu: 2,
            memory: 3145728,
            disk_info: [diskInfo[1]],
            osType: 'centos5',
            osArch: 'x86',
            ip: '10.1.1.1',
            bootStatus: 'REGISTERED',
            isInstalled: true,
            hostComponents: hostComponents[1],
            id: 1
          }
        };
      addServiceController.loadHostsSuccessCallback(response);
      var hostsInDb = addServiceController.getDBProperty('hosts');
      var hostsInModel = addServiceController.get('content.hosts');
      expect(hostsInDb).to.eql(expected);
      expect(hostsInModel).to.eql(expected);
    });

  });

  describe('#loadHostsErrorCallback', function () {

    beforeEach(function () {
      sinon.stub(App.ajax, 'defaultErrorHandler', Em.K);
    });

    afterEach(function () {
      App.ajax.defaultErrorHandler.restore();
    });

    it('should execute default error handler', function () {
      addServiceController.loadHostsErrorCallback({status: '500'}, 'textStatus', 'errorThrown', {url: 'url', method: 'GET'});
      expect(App.ajax.defaultErrorHandler.calledOnce).to.be.true;
      expect(App.ajax.defaultErrorHandler.calledWith({status: '500'}, 'url', 'GET', '500')).to.be.true;
    });

  });

  describe('#loadServices', function() {
    beforeEach(function() {
      this.controller = App.AddServiceController.create({});
      this.db = {};
      sinon.stub(this.controller, 'getDBProperty');
      sinon.stub(this.controller, 'setDBProperty', function(key, value) {
        this.db = value;
      }.bind(this));
    });

    afterEach(function() {
      this.controller.getDBProperty.restore();
      this.controller.setDBProperty.restore();
    });

    var tests = [
      {
        appStackService: [
          Em.Object.create({ id: 'HDFS', serviceName: 'HDFS', coSelectedServices: []}),
          Em.Object.create({ id: 'YARN', serviceName: 'YARN', coSelectedServices: ['MAPREDUCE2']}),
          Em.Object.create({ id: 'MAPREDUCE2', serviceName: 'MAPREDUCE2', coSelectedServices: []}),
          Em.Object.create({ id: 'FALCON', serviceName: 'FALCON', coSelectedServices: []}),
          Em.Object.create({ id: 'STORM', serviceName: 'STORM', coSelectedServices: []})
        ],
        appService: [
          Em.Object.create({ id: 'HDFS', serviceName: 'HDFS'}),
          Em.Object.create({ id: 'STORM', serviceName: 'STORM'})
        ],
        servicesFromDB: false,
        serviceToInstall: 'MAPREDUCE2',
        e: {
          selectedServices: ['HDFS', 'YARN', 'MAPREDUCE2', 'STORM'],
          installedServices: ['HDFS', 'STORM']
        },
        m: 'MapReduce selected on Admin -> Stack Versions Page, Yarn service should be selected because it coselected'
      },
      {
        appStackService: [
          Em.Object.create({ id: 'HDFS', serviceName: 'HDFS', coSelectedServices: []}),
          Em.Object.create({ id: 'YARN', serviceName: 'YARN', coSelectedServices: ['MAPREDUCE2']}),
          Em.Object.create({ id: 'HBASE', serviceName: 'HBASE', coSelectedServices: []}),
          Em.Object.create({ id: 'STORM', serviceName: 'STORM', coSelectedServices: []})
        ],
        appService: [
          Em.Object.create({ id: 'HDFS', serviceName: 'HDFS'}),
          Em.Object.create({ id: 'STORM', serviceName: 'STORM'})
        ],
        servicesFromDB: {
          selectedServices: ['HBASE'],
          installedServices: ['HDFS', 'STORM']
        },
        serviceToInstall: null,
        e: {
          selectedServices: ['HDFS', 'HBASE', 'STORM'],
          installedServices: ['HDFS', 'STORM']
        },
        m: 'HDFS and STORM are installed. Select HBASE'
      }
    ];

    tests.forEach(function(test) {
      it(test.m, function() {
        sinon.stub(App.StackService, 'find').returns(test.appStackService);
        sinon.stub(App.Service, 'find').returns(test.appService);
        this.controller.getDBProperty.withArgs('services').returns(test.servicesFromDB);
        this.controller.set('serviceToInstall', test.serviceToInstall);
        this.controller.loadServices();
        App.StackService.find.restore();
        App.Service.find.restore();
        if (!test.servicesFromDB) {
          // verify saving to local db on first enter to the wizard
          expect(this.db.selectedServices).to.be.eql(test.e.selectedServices);
          expect(this.db.installedServices).to.be.eql(test.e.installedServices);
        } else {
          // verify values for App.StackService
          expect(test.appStackService.filterProperty('isSelected', true).mapProperty('serviceName')).to.be.eql(test.e.selectedServices);
          expect(test.appStackService.filterProperty('isInstalled', true).mapProperty('serviceName')).to.be.eql(test.e.installedServices);
        }
        expect(this.controller.get('serviceToInstall')).to.be.null;
      });
    }, this);
  });

});
