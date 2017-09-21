/*
Comments changed...	
*/


/*feature Branch1*/
(function() {
    'use strict';
    angular
        .module('app')
        .controller('MynetworkOverviewController', MynetworkOverviewController);

    MynetworkOverviewController.$inject = ['$rootScope', '$scope', '$templateCache', 'uiGridConstants', 'lookupData', 'contactService', 'eyconstants', '$uibModal', 'relationshipsData', 'ActivityModal', '$location', '$timeout', 'authService', 'networkData', 'networkService', 'profileData'];

    function MynetworkOverviewController($rootScope, $scope, $templateCache, uiGridConstants, lookupData, contactService, eyconstants, $uibModal, relationshipsData, ActivityModal, $location, $timeout, authService, networkData, networkService, profileData) {

        var vm = this;
        vm.gotIt = gotIt;
        vm.hideCoachMark = hideCoachMark;
        vm.switchView = switchView;
        vm.getContacts = getContacts;
        vm.getConnections = getConnections;
        vm.searchMynetwork = searchMynetwork;
        vm.openDeleteModal = openDeleteModal;
        vm.deleteContacts = deleteContacts;
        vm.isContactsSelected = isContactsSelected;
        vm.editContact = editContact;
        vm.addToCluster = addToCluster;
        vm.removeFromCluster = removeFromCluster;
        vm.manageClusters = manageClusters;
        vm.showInvitable = showInvitable;
        vm.inviteSelected = inviteSelected;
        vm.addContact = addContact;
        vm.deleteAllContacts = deleteAllContacts;
        vm.backToContacts = backToContacts;
        vm.backToVault = backToVault;
        vm.onboardUsers = onboardUsers;
        vm.openInviteModal = openInviteModal;
        vm.showInviteEmail = showInviteEmail;
        vm.importContacts = importContacts;
        vm.exportContacts = exportContacts;
        vm.reloadCurrentIndex = reloadCurrentIndex;
        vm.offBoardSelected = offBoardSelected;
        vm.confirmOffboard = confirmOffboard;
        vm.isOffboardable = isOffboardable;
        vm.gridCheckboxDisable = true;
        vm.countries = lookupData.allCountries;
        vm.editGridContact = editGridContact;
        vm.limitArray = [25, 50, 100, 200];
        vm.loading = false;
        vm.count = 0;
        vm.searchParams = {};
        vm.cluster = [];
        vm.showAdd = true;
        vm.sendingExportReq = false;
        vm.showClusterFilter = false;
        vm.disableYes = false;

        vm.allSlct = false;
        vm.trackOfSelected = trackOfSelected;
        var currentlySelectedContacts = [];
        var totalNetworkCount = 0;
        var enableOverView = false;
        var selectAllContacts = false;
       

        var type = 'both',
            index = 0,
            limit = localStorage.getItem('Overview_pagination_limit') ? parseInt(localStorage.getItem('Overview_pagination_limit')) : 25,
            selectedCompany = "",
            contactsBusy = false,
            paginationOptions = {
                pageNumber: 1,
                pageSize: limit,
            },
            clicked,
            cancelClick,
            sortOrder = ["first_name asc", "last_name asc", "title asc", "email asc", "company_name asc", "country asc"];


      
        /*
         * Clearing the query Parameters on changing the route
         */
        $rootScope.$on('$routeChangeStart', function(event, next, current) {
            var queryParam = $location.search();
            if (_.isEmpty(queryParam) == false && queryParam.hasOwnProperty("view")) {
                if (next.originalPath != '/vault/contacts' && next.originalPath != "/vault/add-contact") {
                    $location.url($location.path());
                }
            }
        });

        $rootScope.$on('backToValutContacts', function(event, next, current) {
            if (!enableOverView) return;
            backToContacts();
        })

        /* Calling on "show connections"
         * checkbox change
         */
        function getConnections(connections) {

            type = connections ? 'connections' : 'both';
            resetToFirstIndex();
        }

        function getContacts(indx, lmt) {
            if (contactsBusy) {
                return;
            }
            contactsBusy = true;
            /* 
             * To load contacts from specified index from outside
             */
            index = angular.isDefined(indx) ? indx : index;
            limit = angular.isDefined(lmt) ? lmt : limit;

            if (vm.viewMode == 'grid') {
                if (vm.gridApi) vm.gridApi.selection.clearSelectedRows();
                vm.gridOptions.data = [];
            }
            var selectedCluster = [];
            vm.loading = true;
            if (vm.cluster.length > 0) {
                selectedCluster = [{
                    'name': vm.cluster[0].name,
                    'network_id': vm.cluster[0].network_id
                }];
            }
            contactService.getAllContacts(type, sortOrder, index, limit, vm.searchParams, selectedCluster)
                .then(function(reply) {
                        if (reply) {
                            if (reply.coach_mark == null || reply.coach_mark[6] == false || !reply.coach_mark[6]) {
                                vm.filterCoachMark = true;
                            }
                            vm.loading = false;
                            indx = undefined;
                            lmt = undefined;

                            if (reply.count != undefined) vm.count = reply.count;
                            if (reply.search != undefined) vm.searchedWord = reply.search;

                            if (index == 0) {

                                vm.contactCount = reply.contact_count || 0;

                                /* The grid view should be the default view when there is at least 1 imported contact.
                                 * When no contacts are imported, tile view should be the default view showing the big 
                                 * "import contacts" button
                                 */
                                if (angular.isUndefined(vm.totalNetworkCount)) {
                                    if (!reply.total_network_count) {
                                        vm.totalNetworkCount = reply.total_network_count || 0;
                                        changeToTileView();
                                        return;
                                    }
                                }
                                vm.totalNetworkCount = reply.total_network_count || 0;
                                /**
                                 *The totalNetworkCount variable is to save the total count and will be used to change 
                                 *the total count value in view while deleting the contacts. 
                                 */
                                totalNetworkCount = vm.totalNetworkCount;
                                vm.cluster_count = reply.count;
                            }

                            if (vm.viewMode == 'grid') {
                                vm.gridOptions.totalItems = reply.count;
                                vm.gridOptions.data = angular.copy(reply.result);
                                var z = 1;
                                _.each(vm.gridOptions.data,function(cntct){
                                    cntct.city = "city " + z;
                                    z++;
                                    cntct.clusters = ['abcd','efgh','qwe234','zzasw']
                                })
                                /**
                                 * This function checks weather previously any contact selected on the page by looping through the currentlySelectedContacts array which containg all the selected 
                                 * contacts.on matching of the contacts it selects the check box of the corresponding row.
                                 */
                                $timeout(function() {
                                    if (selectAllContacts) {
                                        if (currentlySelectedContacts.length) {
                                            vm.gridApi.selection.selectAllRows();
                                            _.each(vm.gridOptions.data, function(contact, index) {
                                                _.each(currentlySelectedContacts, function(seleCont) {
                                                    if (contact.contact_id == seleCont.contact_id) {
                                                        //it makes the contact unselected based on the index value.
                                                        vm.gridApi.selection.unSelectRow(vm.gridOptions.data[index]);
                                                    }
                                                })
                                            })
                                        } else {
                                            vm.gridApi.selection.selectAllRows();
                                        }
                                    } else if (currentlySelectedContacts.length) {
                                        _.each(vm.gridOptions.data, function(contact, index) {
                                            _.each(currentlySelectedContacts, function(seleCont) {
                                                if (contact.contact_id == seleCont.contact_id) {
                                                    //it makes the contact selected based on the index value.
                                                    vm.gridApi.selection.selectRow(vm.gridOptions.data[index]);
                                                }
                                            })
                                        })
                                    }
                                });
                            } else {
                                if (index == 0) vm.contacts = reply.result
                                else vm.contacts = vm.contacts.concat(reply.result);
                            }

                            if (reply.result.length < limit) {
                                contactsBusy = true;
                            } else {
                                index = index + limit;
                                contactsBusy = false;
                            }
                        }
                    },
                    function(error) {
                        contactsBusy = false;
                        vm.loading = false;
                    });
        }

        /*to hide coachmark*/
        function hideCoachMark() {
            vm.filterCoachMark = false;
        };
        /*coach mark*/
        function gotIt(id) {
            return authService.coachMark(id)
                .then(function(op_data) {
                    if (op_data) {
                        vm.filterCoachMark = false;
                    }
                });
        };

        function importContacts() {
            $location.path("/vault/import-contacts/linkedin");
        }

        function editGridContact(entity) {

            if (!entity || (entity.is_contact == '1') && (entity.source == '3')) {
                return;
            }

            if (clicked) {
                cancelClick = true;
                return;
            }
            clicked = true;
            $timeout(function() {
                if (cancelClick) {
                    cancelClick = false;
                    clicked = false;
                    return;
                }

                if (entity) {
                    editContact(entity);
                }
                cancelClick = false;
                clicked = false;
            }, 500);

        }

        function editContact(entity) {
            var indexofSelectedCon = vm.gridOptions.data.indexOf(entity);
            if (entity.contact_id) {

                relationshipsData.setKeyValue("edit-contact", entity.contact_id);
                relationshipsData.setKeyValue("view-contact", "");
                var modalInstance = $uibModal.open({
                    animation: true,
                    backdrop: 'static',
                    templateUrl: "app/relationships/contact.html",
                    controller: "ContactController",
                    controllerAs: "vmC",
                    windowClass: "evy_add_contact_modal_dialog",
                    bindToController: true
                });

                relationshipsData.setKeyValue("edit-modal", modalInstance);
                modalInstance.result.then(function(contact) {
                    /**
                     * The immediate changes of the contact will be reflected in grid view.
                     */
                    var cntct = vm.gridOptions.data[indexofSelectedCon];
                    if (contact.last_name)
                        cntct.last_name = contact.last_name;

                    if (contact.first_name)
                        cntct.first_name = contact.first_name;

                    if (contact.company_name.length) {
                        var company = _.findWhere(contact.company_name, {
                            order: 1
                        })
                        cntct.company_name = company.company_name;
                        cntct.title = company.title;
                    }

                    if (contact.address.length)
                        cntct.country = contact.address[0].country_name;

                    if (contact.preferred_email)
                        cntct.email = contact.preferred_email;
                    else if (angular.isDefined(contact.company_name[0]))
                        cntct.email = angular.isDefined(contact.company_name[0]) ? contact.company_name[0].company_email[0].address : "";
                }, function() {});
            }
        }

        /**
         * This function will be called on every selection of row and push or pop  the data to "currentlySelectedContacts"
         * if the call is from header row it selects all the row and enables "selectAllContacts" flag which will be used while 
         * making api call.
         */
        function trackOfSelected(entity) {
            if (entity == 'selectAll') {
                /**Though the selectAllContacts is true and again it has got the call in such case generally it deselects all data
                 *but if "currentlySelectedContacts" has some data in it then it should again select all the data for that we are having "currentlySelectedContacts.length" as one of the conditions.      
                 */
                if (!selectAllContacts || currentlySelectedContacts.length) {
                    vm.gridApi.selection.selectAllRows();
                    vm.allSlct = true;
                    selectAllContacts = true;
                    currentlySelectedContacts = [];
                } else {
                    vm.gridApi.selection.clearSelectedRows();
                    vm.allSlct = false;
                    selectAllContacts = false;
                }
            } else {
                vm.allSlct = false;
                var found = _.findWhere(currentlySelectedContacts, {
                    contact_id: entity.contact_id
                });
                if (found) {
                    currentlySelectedContacts = currentlySelectedContacts.filter(cntct => entity.contact_id != cntct.contact_id);
                } else
                    currentlySelectedContacts.push(entity)
                console.log(currentlySelectedContacts)

                //If all the contacts of current page and no contacts in currentlySelectedContacts array then the headrow's checkbox will be selected
                if (!currentlySelectedContacts.length && vm.gridApi.selection.getSelectedRows().length == vm.gridOptions.data.length)
                    vm.allSlct = true;
            }
        }
        /*
         * Open , mynetwork search modal
         */
        function searchMynetwork() {

            if (vm.cluster.length > 0) {
                vm.searchParams.cluster = vm.cluster[0];
                vm.searchParams.exact_search = 0;
            }
            relationshipsData.setVaultSearch(vm.searchParams);
            var modalInstance = $uibModal.open({
                animation: true,
                backdrop: 'static',
                templateUrl: 'app/relationships/vault-overview-search.html',
                controller: "ModalController",
                controllerAs: "vmVS",
                windowClass: "evy_vault_search_modal",
                size: "lg",
                bindToController: true
            });
            modalInstance.result.then(function(result) {
                if (!_.isEmpty(result)) {
                    enableOverView = true; //This flag is to enable the on click functionality on overview tab to get back to normal after filtering.
                    vm.searchParams = result;

                    if (vm.searchParams.cluster.name == "All") {
                        vm.cluster = [];
                        vm.searchParams.cluster = [];
                        vm.showAdd = true;
                    }
                    if (vm.cluster.length > 0 && vm.searchParams.cluster) {
                        if (vm.cluster[0].name != vm.searchParams.cluster.name) {
                            vm.cluster[0] = vm.searchParams.cluster;
                        }
                    }
                    if (vm.cluster.length == 0 && (!_.isEmpty(vm.searchParams.cluster))) {
                        vm.cluster[0] = vm.searchParams.cluster;
                    }
                    if (!_.isEmpty(vm.searchParams.cluster)) {
                        if (vm.searchParams.cluster.name == 'My Connections' || vm.searchParams.cluster.name == 'Unassigned') vm.showAdd = true;
                        else vm.showAdd = false;
                    }
                    vm.count = 0;
                    vm.searchedWord = null;
                    vm.showClusterFilter = false;
                    resetToFirstIndex();
                } else {
                    vm.searchParams = {};
                    vm.cluster = [];
                    vm.showAdd = true;
                    relationshipsData.setVaultSearch(vm.searchParams);
                    vm.count = 0;
                    vm.searchedWord = null;
                    vm.showClusterFilter = false;
                    resetToFirstIndex();
                }
            });
        }

        /*
         * back to normal from search
         */
        function backToContacts() {
            vm.searchParams = {};
            vm.cluster = [];
            vm.showAdd = true;
            enableOverView = false;
            resetToFirstIndex();
        }

        function backToVault() {
            vm.cluster = [];
            vm.showAdd = true;
            vm.showClusterFilter = false;
            resetToFirstIndex();
        }
        /*
         * Open , mynetwork delete modal
         */
        function openDeleteModal(contact) {
            if (vm.allSlct && currentlySelectedContacts.length == 0) {
                deleteAllContacts();
                vm.alldlt = true;
                return;
            }
            vm.deleteContact = _.isEmpty(contact) ? currentlySelectedContacts : [contact];
            currentlySelectedContacts = [];
            vm.deleteModal = $uibModal.open({
                animation: true,
                backdrop: 'static',
                keyboard: false,
                size: "sm",
                scope: $scope,
                windowClass: 'evy_modal_dialog',
                templateUrl: "app/relationships/delete-confirmation.html",
                bindToController: true
            });
        }

        /*
         * Calling , deleteContact API
         */
        function deleteContacts() {
            vm.disableYes = true;
            vm.deletingContacts = true;


            var deletingContacts = vm.deleteContact.filter(function(contact) {
                return contact.is_contact == '1';
            });

            var deletingIds = {
                "contact_ids": _.pluck(deletingContacts, "contact_id")
            };

            contactService.deleteSelectedContacts(deletingIds)
                .then(function(reply) {
                    if (reply.code == 200) {
                        vm.deleteContact = {};
                        vm.deleteModal.close();
                        vm.deletingContacts = false;
                        vm.disableYes = false;
                        //  reloadCurrentIndex();
                        for (var x = 0; x < deletingIds.contact_ids.length; x++) {
                            vm.gridOptions.data = _.without(vm.gridOptions.data, _.findWhere(vm.gridOptions.data, {
                                contact_id: deletingIds.contact_ids[x]
                            }));
                        }
                        vm.gridApi.selection.clearSelectedRows();
                        $timeout(function() {
                            vm.count = vm.gridApi.grid.renderContainers.body.renderedRows.length;
                            //console.log(vm.gridApi.core.getVisibleRows(vm.gridApi.grid));
                            vm.totalNetworkCount = totalNetworkCount - deletingIds.contact_ids.length;
                            totalNetworkCount = vm.totalNetworkCount;
                            /*If all the contacts are deleted in current page it calls for the rest of the contacts.*/
                            if (vm.gridApi.grid.renderContainers.body.renderedRows.length == 0)
                                resetToFirstIndex();
                        })
                    }

                }, function(error) {
                    vm.disableYes = false;
                    if (error.code == 667 || error.code == 623) { /* Cannot delete connection updates */
                        // ActivityModal.errorPopup(error);
                        vm.deleteModal.close();
                        reloadCurrentIndex();
                    } else {
                        ActivityModal.errorPopup(error);
                    }
                    vm.deletingContacts = false;
                })
        }


        /* 
         * reload Contacts with current index
         */
        function reloadCurrentIndex() {
            contactsBusy = false;
            if (vm.viewMode == 'grid') {
                index = (paginationOptions.pageNumber - 1) * paginationOptions.pageSize;
                getContacts(index, limit);
            } else {
                index = 0;
                vm.contacts = [];
                getContacts();
            }
        }

        /*
         * return true if any contact selected
         */
        function isContactsSelected() {
            // return (currentlySelectedContacts.length ? true : false);
            if (currentlySelectedContacts.length || vm.allSlct)
                return true;
            else
                return false;
        }

        /* Switching between grid/tile view */
        function switchView(view) {
            if (view == vm.viewMode) {
                return;
            }
            vm.viewMode = view;
            index = 0;
            contactsBusy = false;
            type = 'both';
            if (view == 'grid') {
                vm.gridOptions.paginationCurrentPage = 1;
                vm.gridOptions.data = [];
                limit = localStorage.getItem('Overview_pagination_limit') ? parseInt(localStorage.getItem('Overview_pagination_limit')) : 25,
                    sortOrder = ["first_name asc", "last_name asc", "title asc", "email asc", "company_name asc", "country asc"];
                getContacts();
            } else {
                vm.contacts = [];
                limit = 40;
                sortOrder = [];
            }
        }

        function changeToTileView() {
            vm.viewMode = 'tile';
            index = 0;
            contactsBusy = true;
            type = 'both';
            vm.contacts = [];
            limit = 40;
            sortOrder = [];
        }

        function resetToFirstIndex() {
            contactsBusy = false;
            index = 0;
            if (vm.viewMode == 'grid') {
                vm.gridOptions.totalItems = 0;
            } else {
                vm.contacts = [];
            }
            getContacts();
        }

        /*
         * Only contacts are allowed to select
         */
        function setSelectableContacts(type) {

            vm.gridOptions.isRowSelectable = function(row) {
                return (row.entity.is_contact == '1' && row.entity.source != '3') || (row.entity.is_contact == '0');
            }
            if (vm.gridApi) {
                vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.OPTIONS);
            }
        }

        /*
         * From grid
         */
        function showInviteCount() {
            vm.inviteModal = $uibModal.open({
                animation: true,
                backdrop: 'static',
                keyboard: false,
                size: "lg",
                scope: $scope,
                windowClass: 'evy_modal_dialog',
                templateUrl: "app/relationships/invite-confirmation.html",
                bindToController: true
            });
        }

        function showInvitable(isAllSelected) {

            vm.result = null;
            vm.invitableContacts = [];
            vm.invitableCount = 0;
            vm.isAllSelected = false;
            if (isAllSelected) {

                vm.isAllSelected = isAllSelected;
                if (!vm.isAdmin) { /* getting the count of contacts to invite */
                    if (vm.gettingCount) {
                        return;
                    }
                    vm.gettingCount = true;
                    contactService.getInviteContactCount()
                        .then(function(reply) {
                            if (reply) {
                                vm.invitableCount = reply.count || 0;
                                if (!vm.invitableCount) vm.isAllSelected = false;
                                vm.gettingCount = false;
                                showInviteCount();
                            }
                        }, function() {
                            vm.gettingCount = false;
                        });
                } else {
                    showInviteCount();
                }
            } else {

                var selectedContacts = vm.gridApi.selection.getSelectedRows();
                vm.invitableContacts = [];
                if (!vm.isAdmin) {
                    /* filtering contacts available to invite from
                                             selected contacts, if not admin */
                    vm.invitableContacts = (selectedContacts.filter(function(contact) {
                        return ((contact.is_contact == '1') &&
                            (!contact.is_duplicate) &&
                            (contact.invite_count < 2) &&
                            (contact.connect == 'I') &&
                            (contact.email));
                    }));
                } else {
                    /* filtering contacts available to on-board from
                                             selected contact, if admin */
                    vm.invitableContacts = (selectedContacts.filter(function(contact) {
                        return ((contact.is_contact == '1') &&
                            (contact.connect == 'I') &&
                            (contact.email));
                    }));
                }
                vm.invitableCount = vm.invitableContacts.length;
                showInviteCount();
            }

        }

        /*
         * From grid
         */
        function inviteSelected(isContinue) {

            /* 
             * isContinue shows the confimation from user
             * vm.invitableContacts.length shows the individual invition
             */
            vm.result = null;
            vm.emailPreviewImage = null;
            if (isContinue && vm.invitableContacts.length) {
                vm.inviting = true;
                /*
                 * If not admin :invition
                 */
                if (!vm.isAdmin) {
                    var invites = {
                        contact_id: _.pluck(vm.invitableContacts, "contact_id"),
                        email: _.pluck(vm.invitableContacts, "email")
                    }
                    contactService.inviteContacts(invites)
                        .then(function(reply) {
                            if (reply.code == 200) {
                                _.each(vm.invitableContacts, function(contact) {
                                    contact.invite_count = contact.invite_count + 1;
                                });
                                vm.inviteModal.close(true);
                            } else if (reply.code == 741) { /* If trying to send more than 2 invitions */
                                vm.inviteModal.close(false);
                                ActivityModal.errorPopup(reply);
                            } else if (reply.code == 863) {
                                /* ER-3748 accept code "863" from server when we invite contact */
                                vm.inviteModal.close(false);
                                ActivityModal.errorPopup(reply);
                            }
                            vm.inviting = false;
                            vm.gridApi.selection.clearSelectedRows();
                            vm.invitableContacts = [];
                        }, function() {
                            vm.inviting = false;
                            vm.gridApi.selection.clearSelectedRows();
                            vm.invitableContacts = [];
                        });
                } else {
                    /*
                     * If admin :On-boarding
                     */
                    var onboardingUsers = {};
                    onboardingUsers.on_board_all = "0";
                    onboardingUsers.is_prospect_auto_accept = "1";
                    onboardingUsers.contact_id = _.pluck(vm.invitableContacts, "contact_id");

                    contactService.onboardUsers(onboardingUsers)
                        .then(function(reply) {
                            if (reply.code == 200) {
                                vm.result = reply;
                                vm.inviting = false;
                                reloadCurrentIndex();
                                vm.onboardingUsers = {};
                            }
                        }, function(error) {
                            vm.inviting = false;
                            vm.onboardingUsers = {};
                            vm.inviteModal.close(false);
                            ActivityModal.errorPopup(error);
                        });
                }

            } else if (isContinue && vm.isAllSelected) {
                vm.inviting = true;
                if (!vm.isAdmin) {
                    contactService.inviteAllContacts(localStorage.getItem("uid"))
                        .then(function(reply) {
                            if (reply.code == 200) {
                                vm.inviteModal.close(true);
                                vm.inviting = false;
                                vm.isAllSelected = false;
                                reloadCurrentIndex();
                            }
                        }, function(error) {
                            vm.inviting = false;
                            vm.isAllSelected = false;
                            vm.inviteModal.close(false);
                            ActivityModal.errorPopup(error);
                        });

                } else {
                    var onboardingUsers = {};
                    onboardingUsers.on_board_all = "1";
                    onboardingUsers.is_prospect_auto_accept = "1";
                    onboardingUsers.contact_id = [];

                    contactService.onboardUsers(onboardingUsers)
                        .then(function(reply) {
                            if (reply.code == 200) {
                                vm.result = reply;
                                vm.inviting = false;
                                onboardingUsers = {};
                                resetToFirstIndex();
                            }
                        }, function(error) {
                            vm.inviting = false;
                            onboardingUsers = {};
                            vm.inviteModal.close(false);
                            ActivityModal.errorPopup(error);
                        });
                }
            } else {
                vm.inviteModal.close(false);
                vm.inviting = false;
                onboardingUsers = {};
                vm.invitableContacts = [];
            }
        }

        /* delete all contacts
         * on success of confirmation popup,
         * arrays will cleared locally
         */
        function deleteAllContacts() {
            var modalInstance = $uibModal.open({
                animation: true,
                backdrop: 'static',
                keyboard: false,
                size: 'sm',
                scope: $scope,
                templateUrl: "app/relationships/delete-contacts.html",
                controller: 'ModalController',
                controllerAs: 'vmM',
                windowClass: 'evy_confirm-post-delete_popup',
                bindToController: true
            });
            modalInstance.result.then(function(value) {
                vm.alldlt = false;
                if (value == "ok") {
                    resetToFirstIndex();
                }
            });
        }

        function addContact() {

            var modalInstance = $uibModal.open({
                animation: true,
                backdrop: 'static',
                templateUrl: "app/relationships/contact.html",
                controller: "ContactController",
                controllerAs: "vmC",
                windowClass: "evy_add_contact_modal_dialog",
                bindToController: true
            });
            modalInstance.result.then(function(result) {
                if (result) {
                    reloadCurrentIndex();
                }
            });
            relationshipsData.setKeyValue("add-modal", modalInstance);
        }

        function openInviteModal(contact) {
            /* 
             * Admin only have the ability to onboard users
             */
            if (vm.isAdmin) {
                vm.status = "";
                // vm.loading = false;
                vm.onboardContact = {};
                vm.onboardModal = $uibModal.open({
                    animation: true,
                    backdrop: 'static',
                    keyboard: false,
                    size: "sm",
                    scope: $scope,
                    windowClass: 'evy_modal_dialog',
                    templateUrl: "app/relationships/onboard-confirmation.html",
                    bindToController: true
                });
                vm.onboardContact = contact;

            } else {
                inviteSignleContact(contact);
            }
        };

        function inviteSignleContact(contact) {

            var emails = [];
            var contact_ids = [];
            var contactdata = {};
            var ip_data = {};


            if (contact.email.length > 0) {
                emails.push(contact.email[0].address);
            }
            contact_ids.push(contact.contact_id);
            ip_data[eyconstants.wsParms.EMAIL] = contact.email;
            ip_data[eyconstants.wsParms.FIRST_NAME] = contact.first_name;
            ip_data[eyconstants.wsParms.CONTACT_ID] = contact_ids;
            contactdata = ip_data;

            contactdata.header_title = "Confirm Invitation";
            contactdata.request_type = "I";
            contactdata.requestModal = true;

            relationshipsData.set(true, contactdata);
            var modalInstance = $uibModal.open({
                animation: true,
                backdrop: 'static',
                keyboard: false,
                size: "lg",
                templateUrl: "app/relationships/requests.html",
                controller: "RequestsController",
                controllerAs: "vm",
                bindToController: true,
                windowClass: 'evy_modal_dialog'
            });
            modalInstance.result.then(function(result) {
                if (result != "cancel") {
                    contact.invite_count = contact.invite_count + 1;
                }
            }, function() {

            });
        };


        /*
         * On the success event from confirmation popup,
         * admin will send selected contacts contact_id s 
         * to onboard users.This will perform
            1.Creating Envoy users from contacts
            2.Making them connection to asmin
            3.Cross-connection them to each other
            4.Sending choose password email to those users
            5.Adding to group
         */

        function onboardUsers() {

            // vm.loading = true;
            var rowCol = [];
            var onboardingUsers = {};
            onboardingUsers.on_board_all = "0";
            onboardingUsers.is_prospect_auto_accept = "1";

            if (!_.isEmpty(vm.onboardContact)) {
                onboardingUsers.contact_id = [vm.onboardContact.contact_id];
            }

            contactService.onboardUsers(onboardingUsers)
                .then(function(reply) {
                    vm.result = {};
                    if (reply.code == 200) {
                        vm.result = angular.copy(reply);
                        if (vm.onboardContact) {
                            resetToFirstIndex();
                        }
                        finishOnboarding(true);
                    }
                }, function(error) {
                    finishOnboarding(false, error);
                });

        }

        /*
         * Reverting selections in grid
         */
        function finishOnboarding(result, error) {

            if (result) {
                vm.status = true;
            } else {
                vm.status = false;
                vm.errorMessage = error.message;
            }
            vm.onboardContact = {};
        }

        function showInviteEmail(isShow) {

            if (isShow) {
                vm.downloadingPreview = true;
                contactService.getEmailPreview()
                    .then(function(reply) {
                        if (reply.file) {
                            vm.emailPreviewImage = eyconstants.IS + reply.file;
                            vm.downloadingPreview = false;
                        }
                    }, function(error) {});
            } else {
                vm.emailPreviewImage = null;
            }
        }

        function exportContacts() {

            if (vm.sendingExportReq) {
                return;
            }
            vm.sendingExportReq = true;
            contactService.sendExportRequest(localStorage.getItem('uid'))
                .then(function(reply) {
                    if (reply) {
                        vm.sendingExportReq = false;
                        ActivityModal.statusPopup({
                            code: 200,
                            message: 'An e-mail with a link to download the CSV file' +
                                ' will be sent to the registered e-mail ID once it is ready.'
                        });
                    }
                }, function(error) {
                    vm.sendingExportReq = false;
                    ActivityModal.errorPopup(error);
                });

        }

        function addToCluster(contact) {
            vm.addContacts = _.isEmpty(contact) ? currentlySelectedContacts : [contact];
            networkData.set(false, '');
            networkData.setContacts(vm.addContacts);
            vm.addToClusterModal = $uibModal.open({
                animation: true,
                backdrop: 'static',
                keyboard: false,
                size: 'md',
                templateUrl: "app/network/add-to-network.html",
                bindToController: true,
                controller: "AddToNetworkController",
                controllerAs: "vm"
            });
            vm.addToClusterModal.result.then(function(value) {
                vm.gridApi.selection.clearSelectedRows();
                currentlySelectedContacts = [];
            });
        }

        function manageClusters() {
            var modalInstance = $uibModal.open({
                animation: true,
                backdrop: 'static',
                keyboard: false,
                size: "md",
                templateUrl: "app/relationships/manage-cluster.html",
                controller: "ManageNetworkController",
                windowClass: 'evy_confirm-post-delete_popup evy_manage_cluster',
                controllerAs: "vmMN",
                bindToController: false
            });
        }

        function removeFromCluster(contact) {
            var members = [];
            var member_contact_array = [];

            members = _.isEmpty(contact) ? vm.gridApi.selection.getSelectedRows() : [contact];
            _.each(members, function(member) {
                member_contact_array.push({
                    contact_id: member.contact_id,
                    is_delete: '1'
                });
            })
            var ip_data = {};

            ip_data["member_contact_array"] = member_contact_array;
            networkService.deleteFromNetwork(ip_data, vm.cluster[0].network_id)
                .then(function(reply) {
                    if (reply.data.code == "200") {
                        vm.deleting = false;
                        reloadCurrentIndex();
                        // $rootScope.$broadcast('removedFromNetwork',{userId:vm.member.user_id});
                        // $modalInstance.close('member');
                    }
                }, function(err) {

                });
        }

        /*
         * Enabling offboard button
         */
        function isOffboardable() {

            var selectedContacts = vm.gridApi.selection.getSelectedRows();

            var offboardable = (selectedContacts.filter(function(contact) {
                return contact.is_contact == "0";
            }));

            return (offboardable.length ? true : false);
        }


        /*
         * offboard confirmation
         */
        function offBoardSelected() {

            vm.offboarding = false;
            vm.offboardModal = $uibModal.open({
                animation: true,
                backdrop: 'static',
                keyboard: false,
                size: "md",
                scope: $scope,
                windowClass: 'evy_modal_dialog',
                template: "<div class='modal-header'>" +
                    "<h4 class='modal-title' id='myModalLabel'>Off-Board</h4>" +
                    "</div>" +
                    "<div class='modal-body evy_onboard_confirmation'>" +
                    "<p> You have chosen to off-board the selected user(s). Any Prospect report created by user and any of the user's contacts included in any prospect reports will be removed. Please confirm action.</p>" +
                    "<button ng-click='vmV.confirmOffboard()' ng-disabled='vmV.offboarding'>Ok <img ng-if='vmV.offboarding' class='evy_load_icon_sml' src='assets/images/ey_loading_new.gif'></button>" +
                    "<button class='evy_onboard_confirmation_no' ng-click='vmV.offboardModal.dismiss()'>Cancel</button>" +
                    "</div>",
                bindToController: true
            });
        }

        /*
         * offboard api call
         */
        function confirmOffboard() {

            var selectedContacts = vm.gridApi.selection.getSelectedRows();

            var offboardable = (selectedContacts.filter(function(contact) {
                return contact.is_contact == "0";
            }));

            var invites = {
                contact_ids: _.pluck(offboardable, "contact_id"),
                off_board_all: "0"
            }

            vm.offboarding = true;

            contactService.offboardContacts(invites)
                .then(function(reply) {
                    vm.offboarding = false;
                    vm.gridApi.selection.clearSelectedRows();
                    reloadCurrentIndex();
                    vm.offboardModal.close();
                }, function(error) {
                    vm.offboardModal.close();
                    vm.offboarding = false;
                    ActivityModal.errorPopup(error);
                });
        }

        function init() {

            /* 'startsWith' not supported in IE */
            vm.cluster = networkData.getFilteredCluster();
            if (vm.cluster.length > 0) {
                if (!vm.cluster[0].network_name) vm.cluster[0].network_name = vm.cluster[0].name;
                vm.showClusterFilter = true;
                if (vm.cluster[0].default_network == '1' || vm.cluster[0].network_id == '0') vm.showAdd = true;
                else vm.showAdd = false;
            }

            networkData.setFilteredCluster([]);
            if (!String.prototype.startsWith) {
                String.prototype.startsWith = function(searchString, position) {
                    position = position || 0;
                    return this.indexOf(searchString, position) === position;
                };
            }


            /* ER-4858
             * Checking current user is admin or not.
             * Admin will have power to onboard and crossconnect users.
             * So invite and connect button will change to 
             * onboard and cross connect for Admin users.
             */
            contactService.checkAdmin()
                .then(function(reply) {
                    vm.isAdmin = reply;
                });

            /* 
             * replacing header and cell checkbox with custom styles.
             */
            $templateCache.put('ui-grid/selectionRowHeaderButtons',
                "<div ng-show='(row.entity.is_contact == \"1\" && row.entity.source != \"3\") || (row.entity.is_contact == \"0\")' class=\"ui-grid-selection-row-header-buttons evy_myworld_sidebar_input\" ng-class=\"{'ui-grid-row-selected': row.isSelected}\"><input type=\"checkbox\" class=\"checkbox-custom\" name=\"country\" ng-model=\"row.isSelected\" ng-click=\"row.isSelected=!row.isSelected;selectButtonClick(row, $event);grid.appScope.trackOfSelected(row.entity);\"><label class=\"checkbox-custom-label\">&nbsp;</label></div>"
                // "<div ng-show='(row.entity.is_contact==\"1\" && row.entity.source != \"3\")' class=\"ui-grid-selection-row-header-buttons evy_myworld_sidebar_input\" ng-class=\"{'ui-grid-row-selected': row.isSelected}\"><input type=\"checkbox\" class=\"checkbox-custom\" name=\"country\" ng-model=\"row.isSelected\" ng-click=\"row.isSelected=!row.isSelected;selectButtonClick(row, $event)\"><label class=\"checkbox-custom-label\">&nbsp;</label></div>"
            );

            $templateCache.put('ui-grid/selectionSelectAllButtons',
                "<div class=\"ui-grid-selection-row-header-buttons evy_myworld_sidebar_input\" ng-class=\"{'ui-grid-all-selected': grid.appScope.allSlct}\" ng-if=\"grid.options.enableSelectAll\"><input type=\"checkbox\" class=\"checkbox-custom\" name=\"country\" ng-model=\"grid.appScope.allSlct\" ng-click=\"grid.appScope.trackOfSelected('selectAll');\"><label class=\"checkbox-custom-label\">&nbsp;</label></div>"

                //  "<div class=\"ui-grid-selection-row-header-buttons evy_myworld_sidebar_input\" ng-class=\"{'ui-grid-all-selected': grid.selection.selectAll}\" ng-if=\"grid.options.enableSelectAll\"><input type=\"checkbox\" class=\"checkbox-custom\" name=\"country\" ng-model=\"grid.selection.selectAll\" ng-click=\"grid.selection.selectAll=!grid.selection.selectAll;headerButtonClick($event);grid.appScope.trackOfSelected('selectAll');\"><label class=\"checkbox-custom-label\">&nbsp;</label></div>"
                //"<div class=\"ui-grid-selection-row-header-buttons \" ng-class=\"{'ui-grid-all-selected': grid.selection.selectAll}\" ng-if=\"grid.options.enableSelectAll\"><input style=\"margin: 0; vertical-align: middle\" type=\"checkbox\" ng-model=\"grid.selection.selectAll\" ng-click=\"grid.selection.selectAll=!grid.selection.selectAll;headerButtonClick($event)\"></div>"
            );

            /*
             * grid column definitions
             */

            var columnDefs = [{
                name: 'Action',
                displayName: 'Action',
                headerTooltip: 'Action',
                enableFiltering: false,
                enableColumnMenus: false,
                enableSorting: false,
                enableCellEdit: false,
                enableRowSelection: false,
                enableColumnResizing: false,
                cellTemplate: '<div>' +
                    '<div ng-hide="(row.entity.is_contact == \'1\') && (row.entity.source ==\'3\')" class="btn_edit grid_btn_position" ng-click="grid.appScope.editContact(row.entity)" title="Edit"><i></i></div>' +
                    '<div ng-if="(row.entity.is_contact == \'1\') && (row.entity.source !=\'3\')" class="evy_rltn_icon8 grid_btn_position" ng-click="grid.appScope.openDeleteModal(row.entity)" title="Delete"><i></i></div>' +
                    '</div>' +

                    '<!-- Envoy user, Not Connection -->' +
                    '<div title="Envoy User" ng-click="grid.appScope.redirectTo(\'profile/\' + row.entity.user_id)" ng-if="(!row.entity.is_duplicate) && (row.entity.is_contact == \'1\') && (row.entity.connect == \'C\')" class="evy_rltn_icon12">' +
                    '<i></i>' +
                    '</div>' +

                    '<!-- Connection -->' +
                    '<div ng-if="(row.entity.is_contact == \'0\')" title="Connection" ng-click="grid.appScope.redirectTo(\'profile/\' + row.entity.user_id)"  class="evy_rltn_icon13">' +
                    '<i></i>' +
                    '</div>' +

                    '<!-- Connection update-->' +
                    '<div ng-if="((row.entity.is_contact == \'1\') && (row.entity.source ==\'3\'))" title="Connection Update" ng-click="grid.appScope.redirectTo(\'profile/\' + row.entity.user_id)"  class="contactevy">' +
                    '<i></i>' +
                    '</div>' +

                    '<!-- Duplicate -->' +
                    '<div ng-if="(row.entity.is_contact != \'0\') && (row.entity.is_duplicate) && (row.entity.source !=\'3\')" class="evy_rltn_icon11" title="Duplicate">' +
                    '<i></i>' +
                    '</div>',

            }, {
                name: 'first_name',
                displayName: 'First Name',
                headerTooltip: 'First Name',
                cellEditableCondition: function(scope) {
                    return ((scope.row.entity.is_contact == '0') || (scope.row.entity.is_contact == '1' && scope.row.entity.source != '3'));
                },
                sortDirectionCycle: [uiGridConstants.ASC, uiGridConstants.DESC],
                sort: {
                    direction: 'asc'
                },
                cellTemplate: '<span style="cursor:pointer" ng-click="grid.appScope.editGridContact(row.entity)">' +
                    '<span ng-bind="row.entity.first_name"></span>' +
                    '</span>',
                editableCellTemplate: "<div>" +
                    "<form name=\"inputForm\"><input type=\"INPUT_TYPE\" ng-class=\"'colt' + col.uid\" ui-grid-editor ng-model=\"MODEL_COL_FIELD\" maxlength=\"50\" ng-required=\"!row.entity.last_name\">" +
                    "<div ng-show=\"!inputForm.$valid\">" +
                    "<span class=\"error\" style=\"color:red\"></span>" +
                    "</div>" +
                    "</form>" +
                    "</div>",
            }, {
                name: 'last_name',
                displayName: 'Last Name',
                headerTooltip: 'Last Name',
                cellEditableCondition: function(scope) {
                    return ((scope.row.entity.is_contact == '0') || (scope.row.entity.is_contact == '1' && scope.row.entity.source != '3'));
                },
                sortDirectionCycle: [uiGridConstants.ASC, uiGridConstants.DESC],
                cellTemplate: '<span style="cursor:pointer" ng-click="grid.appScope.editGridContact(row.entity)">' +
                    '<span ng-bind="row.entity.last_name"></span>' +
                    '</span>',
                editableCellTemplate: "<div>" +
                    "<form name=\"inputForm\"><input type=\"INPUT_TYPE\" ng-class=\"'colt' + col.uid\" ui-grid-editor ng-model=\"MODEL_COL_FIELD\" maxlength=\"50\" ng-required=\"!row.entity.first_name\">" +
                    "<div ng-show=\"!inputForm.$valid\">" +
                    "<span class=\"error\" style=\"color:red\"></span>" +
                    "</div>" +
                    "</form>" +
                    "</div>",
            }, {
                name: 'title',
                displayName: 'Title',
                headerTooltip: 'Title',
                cellEditableCondition: function(scope) {
                    return ((scope.row.entity.is_contact == '0') || (scope.row.entity.is_contact == '1' && scope.row.entity.source != '3'));
                },
                sortDirectionCycle: [uiGridConstants.ASC, uiGridConstants.DESC],
                editableCellTemplate: "<div>" +
                    "<form name=\"inputForm\"><input type=\"INPUT_TYPE\" ng-class=\"'colt' + col.uid\" ui-grid-editor ng-model=\"MODEL_COL_FIELD\" maxlength=\"128\">" +
                    "<div ng-show=\"!inputForm.$valid\">" +
                    "<span class=\"error\" style=\"color:red\"></span>" +
                    "</div>" +
                    "</form>" +
                    "</div>",
            }, {
                name: 'email',
                displayName: 'Email Address',
                headerTooltip: 'Email Address',
                enableCellEdit: false,
                sortDirectionCycle: [uiGridConstants.ASC, uiGridConstants.DESC],
                cellTemplate: '<span ng-if="row.entity.email"><a href=\"mailto:{{row.entity.email}}\">{{row.entity.email}}</a></span>',
            }, {
                name: 'company_name',
                displayName: 'Company',
                headerTooltip: 'Company',
                cellEditableCondition: function(scope) {
                    return ((scope.row.entity.is_contact == '0') || (scope.row.entity.is_contact == '1' && scope.row.entity.source != '3'));
                },
                sortDirectionCycle: [uiGridConstants.ASC, uiGridConstants.DESC],
                editableCellTemplate: '<div>{{$viewValue}}' +
                    '<form name="inputForm">' +
                    '<input typeahead-append-to-body="true" ng-blur="grid.appScope.updateCompanyName(row.entity, $item)" type="INPUT_TYPE" typeahead-select-on-blur="true" typeahead-focus-first="false"  ui-grid-edit ng-model=\"MODEL_COL_FIELD\" ui-grid-editor typeahead-editable ="true" typeahead-on-select="grid.appScope.updateCompanyName(row.entity, $item)"  uib-typeahead="company.company for company in grid.appScope.getCompanyList($viewValue) | limitTo:10">' +
                    '</form>' +
                    '</div>',
            }, {
                name: 'country',
                headerTooltip: 'Country',
                displayName: 'Country',
                cellEditableCondition: function(scope) {
                    return ((scope.row.entity.is_contact == '0') || (scope.row.entity.is_contact == '1' && scope.row.entity.source != '3'));
                },
                sortDirectionCycle: [uiGridConstants.ASC, uiGridConstants.DESC],
                editableCellTemplate: '<div>{{$viewValue}}' +
                    '<form name="inputForm">' +
                    '<input typeahead-append-to-body="true" type="INPUT_TYPE" typeahead-select-on-blur="true"  ui-grid-edit ng-model=\"MODEL_COL_FIELD\" ui-grid-editor typeahead-editable ="false" typeahead-on-select="grid.appScope.typeaheadSelected(row.entity, $item)"  uib-typeahead="country.short_name for country in grid.appScope.countries.countryList | filter:$viewValue:grid.appScope.startsWith | limitTo:10">' +
                    '</form>' +
                    '</div>',
                minWidth: 100,
                maxWidth: 100,
            },{
            name: 'city',
            displayName: 'City',
            headerTooltip: 'City',
            cellEditableCondition: function(scope) {
                return ((scope.row.entity.is_contact == '0') || (scope.row.entity.is_contact == '1' && scope.row.entity.source != '3'));
            },
            sortDirectionCycle: [uiGridConstants.ASC, uiGridConstants.DESC],
            editableCellTemplate: "<div>" +
                "<form name=\"inputForm\"><input type=\"INPUT_TYPE\" ng-class=\"'colt' + col.uid\" ui-grid-editor ng-model=\"MODEL_COL_FIELD\" maxlength=\"128\">" +
                "<div ng-show=\"!inputForm.$valid\">" +
                "<span class=\"error\" style=\"color:red\"></span>" +
                "</div>" +
                "</form>" +
                "</div>",
        },{
                name: 'clusters',
                displayName: 'Clusters',
                headerTooltip: 'Clusters',
                enableCellEdit: false,
                sortDirectionCycle: [uiGridConstants.ASC, uiGridConstants.DESC],
                cellTemplate: '<span style="cursor:pointer">' +
                '<span style="display:inline;padding:5px;" ng-repeat="clstr in row.entity.clusters">{{clstr}},</span>' +
                '</span>',
            } ];

            vm.gridOptions = {
                columnDefs: columnDefs,
                rowHeight: 30,
                enableSelectAll: true,
                enableColumnMenus: false,
                enablePaginationControls: false,
                paginationPageSize: limit,
                minRowsToShow: limit,
                virtualizationThreshold: limit,
                enableHorizontalScrollbar: 0,
                enableVerticalScrollbar: 0,
                useExternalPagination: true,
                useExternalSorting: true,
                totalItems: 0,
            };

            /* setting grid scope to app scope
             * functions from grid.
             */
            vm.gridOptions.appScopeProvider = vm;
            vm.getCompanyList = function(viewValue) {
                return contactService.getCompanyList(viewValue);
            }
            vm.updateCompanyName = function(entity, selectedItem) {
                selectedCompany = selectedItem;
                $scope.$broadcast('uiGridEventEndCellEdit');
            }
            vm.typeaheadSelected = function(entity, selectedItem) {
                $scope.$broadcast('uiGridEventEndCellEdit');
            }
            vm.startsWith = function(country, viewValue) {
                if (country.short_name) {
                    return country.short_name.substr(0, viewValue.length).toLowerCase() == viewValue.toLowerCase();
                }
            }
            vm.redirectTo = function(url) {
                $location.path(url)
            }
            /* 
             * registering grid
             */
            vm.gridOptions.onRegisterApi = function(gridApi) {

                vm.gridApi = gridApi;
                /*
                 * Calling on grid pagination change
                 */
                gridApi.pagination.on.paginationChanged($scope, function(newPage, pageSize) {
                    localStorage.setItem("Overview_pagination_limit", pageSize); //By setting this value the page size will be remained while opening the vault page.
                    limit = vm.gridOptions.paginationPageSize;
                    vm.gridOptions.paginationPageSize = limit;
                    vm.gridOptions.minRowsToShow = limit;
                    vm.gridOptions.virtualizationThreshold = limit;

                    paginationOptions.pageNumber = newPage;
                    paginationOptions.pageSize = pageSize;
                    index = (paginationOptions.pageNumber - 1) * paginationOptions.pageSize;
                    vm.gridOptions.data = [];
                    contactsBusy = false;

                    getContacts(index, limit);
                });
                /*
                 * Calling on grid cell edit
                 */
                gridApi.edit.on.afterCellEdit(null, function(rowEntity, colDef, newValue, oldValue) {

                    if (oldValue != newValue) {
                        var ip_data = {};
                        switch (colDef.name) {
                            case "first_name":
                                ip_data[eyconstants.wsParms.FIRST_NAME] = newValue;
                                break;
                            case "last_name":
                                ip_data[eyconstants.wsParms.LAST_NAME] = newValue;
                                break;
                            case "title":
                                ip_data[eyconstants.wsParms.TITLE] = newValue;
                                break;
                            case "company_name":
                                var ip_data = {};
                                if (selectedCompany) {
                                    ip_data[eyconstants.wsParms.COMPANY_NAME] = selectedCompany.company;
                                    ip_data[eyconstants.wsParms.COMPANY_ID] = selectedCompany.company_id;
                                } else {
                                    ip_data[eyconstants.wsParms.COMPANY_NAME] = newValue;
                                    ip_data[eyconstants.wsParms.COMPANY_ID] = "";
                                }
                                selectedCompany = "";
                                break;
                            case "country":
                                var found = _.find(vm.countries.countryList, function(country) {
                                    return country.short_name === newValue;
                                });

                                if (_.isEmpty(found) == false) {
                                    ip_data.address = [{
                                        country_id: found.country_id
                                    }];
                                } else {
                                    ip_data.address = [{
                                        country_id: ""
                                    }];
                                }
                        }
                        if (!_.isEmpty(ip_data)) {
                            return contactService.editContactInline(ip_data, rowEntity.contact_id)
                                .then(function(op_data) {
                                    if (op_data.code == 600) {
                                        var errorcode = op_data.errors[0].code;
                                    }
                                });
                        }
                    }
                });
                /*
                 * Calling on sort order change
                 */
                gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {

                    if (sortColumns.length) {
                        if (vm.lastSortedColumn && (sortColumns[0].name != vm.lastSortedColumn)) {
                            var sortedItem = _.find(vm.lastSortedOrder, function(sort) {
                                return sort.startsWith(sortColumns[0].name);
                            });
                            if (sortedItem) {
                                var direction = sortedItem.replace(new RegExp(sortColumns[0].name), "");
                                vm.gridOptions.columnDefs.forEach(function(col) {
                                    if (col.name == sortColumns[0].name) {
                                        sortColumns[0].sort.direction = direction.trim();
                                    }
                                })
                            }
                        }

                        sortOrder = _.without(sortOrder, _.find(sortOrder, function(item) {
                            return item.startsWith(sortColumns[0].name);
                        }));
                        sortOrder.unshift(sortColumns[0].name + " " + sortColumns[0].sort.direction);

                        vm.lastSortedOrder = angular.copy(sortOrder);
                        vm.lastSortedColumn = sortColumns[0].name;
                        resetToFirstIndex();
                    }
                });
            };

            switchView('grid');
            getContacts();
        }
        init();
        setSelectableContacts();
    }
})();