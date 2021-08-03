/* eslint-disable indent */
module.exports = function(RED) {

	var count = 0;

	function HTML(config) {
		count++;
		
		var id = "nr-db-ifm" + count;
		var url = config.url ? config.url : "";
		var allow = "autoplay";
		var origin = config.origin ? config.origin : "*";
		var scale = config.scale;
		if (!scale || (scale === "")) {
			scale = 100;
		}

		var html = String.raw`
		<style>
			.nr-dashboard-ui_iframe_modal { padding:0; }
			.overlay { position: fixed; top: 0; left: 0; height: 100%; width: 100%; z-index: 10; background-color: rgba(0,0,0,0.5); display: none; text-align: center; padding: 5%; }
			.visible { display: block; }
		</style>
		<div id="${id}-overlay" class="overlay" onclick="event.preventDefault(); document.getElementById('${id}-overlay').classList.remove('visible');">
			<iframe id="${id}" src="${url}" allow="${allow}" style="width: 60vw; height:50vh; overflow: hidden; border:0; display: inline-block">
				Failed to load Web page
			</iframe>
		</div>
		<script>
			(function(scope) {
				var iframe = document.getElementById("${id}");
				var overlay = document.getElementById("${id}-overlay");

				scope.$watch("msg", function(msg) {
					if (iframe && msg) {
						if (msg.url) {
							iframe.setAttribute("src", msg.url);
							overlay.classList.add("visible");
						}
					}
				});
			})(scope);
		</script>
		`;

		return html;
	}

	function checkConfig(node, conf) {
		if (!conf || !conf.hasOwnProperty("group")) {
			node.error(RED._("ui_iframe_modal.error.no-group"));
			return false;
		}
		return true;
	}

	var ui = undefined;

	function IFrameModalNode(config) {
		try {
			var node = this;
			if(ui === undefined) {
				ui = RED.require("node-red-dashboard")(RED);
			}
			RED.nodes.createNode(this, config);

			if (checkConfig(node, config)) {
				var html = HTML(config);                    // *REQUIRED* !!DO NOT EDIT!!
				var done = ui.addWidget({                   // *REQUIRED* !!DO NOT EDIT!!
					node: node,                             // *REQUIRED* !!DO NOT EDIT!!
					order: config.order,                    // *REQUIRED* !!DO NOT EDIT!!
					group: config.group,                    // *REQUIRED* !!DO NOT EDIT!!
					width: 0, //config.width,                    // *REQUIRED* !!DO NOT EDIT!!
					height: 0, //config.height,                  // *REQUIRED* !!DO NOT EDIT!!
					format: html,                           // *REQUIRED* !!DO NOT EDIT!!
					templateScope: "local",                 // *REQUIRED* !!DO NOT EDIT!!
					emitOnlyNewValues: false,               // *REQUIRED* Edit this if you would like your node to only emit new values.
					forwardInputMessages: false,            // *REQUIRED* Edit this if you would like your node to forward the input message to it's ouput.
					storeFrontEndInputAsState: false,       // *REQUIRED* If the widgect accepts user input - should it update the backend stored state ?

					convertBack: function (value) {
						return value;
					},

					beforeEmit: function(msg, value) {
						return { msg: msg };
					},

					beforeSend: function (msg, orig) {
						if (orig) {
							return orig.msg;
						}
					},

					initController: function($scope, events) {
						//debugger;

						$scope.flag = true;   // not sure if this is needed?

						$scope.init = function (config) {
							$scope.config = config;
							$scope.textContent = config.textLabel;
						};

						$scope.$watch('msg', function(msg) {
							if (!msg) { return; } // Ignore undefined msg
							$scope.textContent = msg.payload;
						});
	
						$scope.change = function() {
							// The data will be stored in the model on the scope
							$scope.send({payload: $scope.textContent});
						};

						$scope.enterkey = function(keyEvent){
							if (keyEvent.which === 13) {
								$scope.send({payload: $scope.textContent});
							}
						};	
					}
				});
			}
		}
		catch (e) {
			// eslint-disable-next-line no-console
			console.warn(e);		// catch any errors that may occur and display them in the web browsers console
		}

		node.on("close", function() {
			if (done) {
				done();
			}
		});
	}
	
	setImmediate(function() {
		RED.nodes.registerType("ui_iframe_modal", IFrameModalNode);
	})

}