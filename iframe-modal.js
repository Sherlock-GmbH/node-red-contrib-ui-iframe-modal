/* eslint-disable indent */
module.exports = function(RED) {

	var count = 0;

	function HTML(config) {
		count++;
		
		var id = "nr-db-ifm" + count;
		var url = (config.url && config.url !== "") ? config.url : "not-set";
		var allow = "autoplay";
		var origin = config.origin ? config.origin : "*";
		var scale = config.scale;
		if (!scale || (scale === "")) {
			scale = 100;
		}
		var iframeWidth = (config.iframeWidth !== '') ? config.iframeWidth : 50;
		var iframeHeight = (config.iframeHeight !== '') ? config.iframeHeight : 50;

		var html = String.raw`
		<style>
			.overlay { position: fixed; top: 0; left: 0; height: 100%; width: 100%; z-index: 10; background-color: rgba(0,0,0,0.5); display: block; text-align: center; padding: 5%; }
			.overlay div.container { background-color: white; border: 6px solid var(--nr-dashboard-pageTitlebarBackgroundColor); display: inline-block; }
			.overlay div.container iframe { overflow: hidden; border: 0; display: none; }
			.overlay div.container div.loading { padding: 10%; }
		</style>
		<script>
			(function(scope) {
				scope.$watch("msg", function(msg) {
					// prioritize msg before config
					var frameUrl = 'not-set';
					frameUrl = (msg && msg.url) ? msg.url : '${url}';					

					// only build iframe if we have a valid URL
					if (frameUrl === 'not-set' || frameUrl === '') { return; }

					window.closeIframeModal = function() {
						document.body.removeChild(document.getElementById('${id}-overlay')); 
						scope.send({payload: '', url: ''});
					}

					// build iframe html
					var frameHtml = '<div class="overlay" onclick="closeIframeModal()">';
					frameHtml += '<div class="container" style="width: ${iframeWidth}vw; height: ${iframeHeight}vh;"><div class="loading" id="${id}-loading"><i class="fa fa-spinner fa-spin"></i></div>';
					frameHtml += '<iframe id="${id}" src="' + frameUrl + '" allow="${allow}" style="width: ${iframeWidth}vw; height: ${iframeHeight}vh;">';
					frameHtml += 'Failed to load Web page';
					frameHtml += '</iframe></div></div>';

					// add html to document body
					var frameDiv = document.createElement("div");
					frameDiv.id = "${id}-overlay";
					frameDiv.innerHTML = frameHtml;
					document.body.appendChild(frameDiv);
								
					// add loading handler
					var iframeElem = document.getElementById('${id}');
					iframeElem.addEventListener('load', function() {
					    document.getElementById('${id}-loading').style.display = 'none';
						iframeElem.style.display = 'block';
					});
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
					width: config.width,                    // *REQUIRED* !!DO NOT EDIT!!
					height: config.height,                  // *REQUIRED* !!DO NOT EDIT!!
					format: html,                           // *REQUIRED* !!DO NOT EDIT!!
					templateScope: "local",                 // *REQUIRED* !!DO NOT EDIT!!
					emitOnlyNewValues: false,               // *REQUIRED* Edit this if you would like your node to only emit new values.
					forwardInputMessages: false,            // *REQUIRED* Edit this if you would like your node to forward the input message to it's ouput.
					storeFrontEndInputAsState: true,       // *REQUIRED* If the widgect accepts user input - should it update the backend stored state ?

					beforeEmit: function(msg, value) {
						return { msg: msg };
					},

					beforeSend: function (msg, orig) {
						if (orig) {
							return orig.msg;
						}
					},

					initController: function($scope, events) {
						$scope.flag = true;   // not sure if this is needed?

						$scope.init = function (config) {
							$scope.config = config;
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