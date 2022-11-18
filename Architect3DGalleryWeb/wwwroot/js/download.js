const Architect3DGallery = require("Architect3DGallery");
const shell = Architect3DGallery.shell;
const remote = Architect3DGallery.remote;
const dialog = remote.dialog;
const BrowserWindow = remote.BrowserWindow;
const fs = require("fs");
const prompt = require("dialogs")((opts = {}));
const mkdirp = require("mkdirp");
const homedir = require("os").homedir();
const sanitize = require("sanitize-filename");
const vtt2srt = require("node-vtt-to-srt");
const Downloader = require("mt-files-downloader");
const https = require("https");
const cookie = require("cookie");

const app = require("http").createServer();
const io = require("socket.io")(app);

const pageSize = 25;
const corruptedOBJSize = 20000;
const $loginAuthenticator = $(".ui.login.authenticator");

var headers;
var repoAccount = 'Khalif';
var awaitingLogin = false;


var $divSubDomain = $(".ui.login #divsubdomain");
var $subDomain = $(".ui.login #subdomain");
var subDomain = settings.get("subdomain") || "www";
var settingsCached = null;

app.listen(9009);

console.log('access_token', settings.get("access_token"));
console.table(getAllDownloadsHistory());

if (!settings.get("general")) {
  loadDefaults();
}
else {
  settingsCached = settings.getAll();
}
function loadDefaults() {
  settings.set("download", {
    checkNewVersion: true,
    autoStartDownload: false,
    continueDonwloadingEncrypted: false,
    enableDownloadStartEnd: false,
    skipAttachments: false,
    skipSubtitles: false,
    autoRetry: false,
    downloadStart: false,
    downloadEnd: false,
    videoQuality: false,
    path: false,
    defaultSubtitle: "",
    seqZeroLeft: false,
  });

  settings.set("general", {
    language: false
  });

  settingsCached = settings.getAll();
}

io.on("connect", function (socket) {
  console.log('io.onConnect');
  $loginAuthenticator.removeClass("disabled");

  socket.on("disconnect", function () {
    console.log('socket.onDisconnect');
    $loginAuthenticator.addClass("disabled");
    $(".ui.authenticator.dimmer").removeClass("active");
    awaitingLogin = false;
  });

  $loginAuthenticator.click(function () {
    $(".ui.authenticator.dimmer").addClass("active");
    awaitingLogin = true;
    socket.emit("awaitingLogin");
  });

  socket.on("newLogin", function (data) {
    console.log('socket.onNewLogin');
    if (awaitingLogin) {
      settings.set("access_token", data.access_token);
      settings.set("subdomain", data.subdomain);
      checkLogin();
    }
  });
});

Architect3DGallery.ipcRenderer.on("saveDownloads", function () {
  saveDownloads(true);
});

$(".ui.dropdown").dropdown();

$(document).ajaxError(function (event, request) {
  $(".dimmer").removeClass("active");
});

var downloadTemplate = `
<div class="ui tiny icon action buttons">
  <button class="ui basic blue download button"><i class="download icon"></i></button>
  <button class="ui basic red disabled pause button"><i class="pause icon"></i></button>
  <button class="ui basic green disabled resume button"><i class="play icon"></i></button>
  
  <div style="height: 1px; width: 5px;"></div>
  
  <button class="ui basic yellow open-in-browser button"><i class="desktop icon"></i></button>
  <button class="ui basic teal open-dir button"><i class="folder open icon"></i></button>
  
</div>
<div class="ui horizontal divider"></div>
<div class="ui tiny indicating individual progress">
   <div class="bar"></div>
</div>
<div class="ui horizontal divider"></div>
<div class="ui small indicating combined progress">
  <div class="bar">
    <div class="progress"></div>
  </div>
  <div class="label">${translate("Building object Data")}</div>
</div>
<div class="info-downloaded"></div>`;

function htmlobjectCard(object, downloadSection = false) {
  if (!object.completed) { object.completed = false; }
  object.infoDownloaded = "";
  object.encryptedObjects = 0;
  object.pathDownloaded = "";

  const history = getDownloadHistory(object.id);
  if (history) {
    object.infoDownloaded = translate((history?.completed ? "Download completed on" : "Download started since")) + " " + history?.date;
    object.completed = history?.completed ? true : object.completed;
    object.encryptedObjects = history?.encryptedObjects ?? 0;
    object.selectedSubtitle = history?.selectedSubtitle ?? "";
    object.pathDownloaded = history?.pathDownloaded ?? "";
  }

  if (!fs.existsSync(object.pathDownloaded))
    object.pathDownloaded = getPathDownloadsSetting(object.title);


  const tagDismiss = `<a class="ui basic dismiss-download">${translate("Dismiss")}</a>`;

  var $object = $(`
    <div class="ui object item" object-id="${object.id}" object-url="${object.url}" object-completed="${object.completed}">
      <input type="hidden" name="encryptedObjects" value="${object.encryptedObjects}">
      <input type="hidden" name="selectedSubtitle" value="${object.selectedSubtitle}">
      <input type="hidden" name="path-downloaded" value="${object.pathDownloaded}">
      <div class="ui tiny label download-quality grey"></div>
      <div class="ui tiny grey label download-speed">
        <span class="value">0</span>
        <span class="download-unit"> KB/s</span>
      </div>
      <div class="ui tiny image wrapper">
        <div class="ui red left corner label icon-encrypted">
          <i class="lock icon"></i>
        </div>
        <img src="${(object.image ?? object.image_240x135)}" class="object-image border-radius" />
        ${(downloadSection ? tagDismiss : '')}        
        <div class="tooltip">${(object.encryptedObjects == 0 ? '' : translate("Contains encrypted Objects"))}</div>
      </div>
      <div class="content">
        <span class="objectname">${object.title}</span>
        <div class="ui tiny icon green download-success message">
          <i class="check icon"></i>
          <div class="content">
            <div class="headers">
              <h4>${translate("Download Completed")}</h4>
            </div>
            <p>${translate("Click to dismiss")}</p>
          </div>
        </div>
        <div class="ui tiny icon red download-error message">
          <i class="bug icon"></i>
          <div class="content">
            <div class="headers">
              <h4>${translate("Download Failed")}</h4>
            </div>
            <p>${translate("Click to retry")}</p>
          </div>
        </div>
        <div class="ui tiny icon purple object-encrypted message">
          <i class="lock icon"></i>
          <div class="content">
            <div class="headers">
              <h4>${translate("Contains encrypted Objects")}</h4>
            </div>
            <p>${translate("Click to dismiss")}</p>
          </div>
        </div>
        <div class="extra download-status">
          ${downloadTemplate}
        </div>
      </div>
      
    </div>`);

  if (!downloadSection) {
    if (object.completed) {
      resetobject($object, $object.find(".download-success"));
    }
    else if (object.encryptedObjects > 0) {
      resetobject($object, $object.find(".object-encrypted"));
    } else {
      $object.find(".info-downloaded").html(object.infoDownloaded).show();
    }
  }
  else {
    if (object.completed) {
      $object.find(".info-downloaded").html("<span style='color: #46C055'>" + object.infoDownloaded + "</span>").show();
    }
    else {
      $object.find(".individual.progress").progress({ percent: object.individualProgress }).show();
      $object.find(".combined.progress").progress({ percent: object.combinedProgress }).show();
      $object.find(".download-status .label").html(object.progressStatus);
      $object.find(".info-downloaded").hide();
      $object.css("padding-bottom", "25px");
    }
  }

  if (object.encryptedObjects == "0") {
    $object.find(".icon-encrypted").hide();
    $object.find(".ui.tiny.image .tooltip").hide();
    $object.find(".ui.tiny.image").removeClass("wrapper");

  } else {
    $object.find(".icon-encrypted").show()
    $object.find(".ui.tiny.image .tooltip").show();
    $object.find(".ui.tiny.image").addClass("wrapper")
  }

  if (!fs.existsSync(object.pathDownloaded)) {
    $object.find(".open-dir.button").hide();
  }

  return $object;
}

$(".ui.login #business").change(function () {
  if ($(this).is(":checked")) {
    $subDomain.val(subDomain);
    $divSubDomain.show();
  }
  else {
    $subDomain.val(null);
    $divSubDomain.hide();
  }
});

checkLogin();


$(".ui.dashboard .content").on("click", ".open-in-browser", function () {
  const link = `https://${subDomain}.architect.com${$(this).parents(".object.item").attr('object-url')}`;
  shell.openExternal(link);
});

$(".ui.dashboard .content").on("click", ".open-dir", function () {
  const pathDownloaded = $(this).parents(".object.item").find('input[name="path-downloaded"]').val();
  shell.openItem(pathDownloaded);
});

$(".ui.dashboard .content").on("click", ".dismiss-download", function () {
  const objectId = $(this).parents(".object.item").attr('object-id');
  removeCurseDownloads(objectId);
});

$(".ui.dashboard .content").on("click", ".load-more.button", function () {
  var $this = $(this);
  var $objects = $this.prev(".objects.items");
  $.ajax({
    type: "GET",
    url: $this.data("url"),
    beforeSend: function () {
      $(".ui.dashboard .objects.dimmer").addClass("active");
    },
    headers: headers,
    success: function (response) {
      $(".ui.dashboard .objects.dimmer").removeClass("active");
      $.each(response.results, function (index, object) {
        htmlobjectCard(object).appendTo($objects);
      });
      if (!response.next) {
        $this.remove();
      } else {
        $this.data("url", response.next);
      }
    }
  });
});

$(".ui.dashboard .content").on("click", ".check-updates", function () {
  checkUpdate("Khalif");
});
$(".ui.dashboard .content").on("click", ".check-updates-original", function () {
  checkUpdate("KhalifRich");
});
$(".ui.dashboard .content").on("click", ".old-version-mac", function () {
  shell.openExternal(
    'https://github.com/KhalifRich/architect-downloader-gui/releases/download/v1.0.2/architect3dgallery-1.0.2-mac.dmg'
  );
});
$(".ui.dashboard .content").on("click", ".old-version-linux", function () {
  shell.openExternal(
    'https://github.com/KhalifRich/architect-downloader-gui/releases/download/v1.0.2/architect3dgallery-1.0.2-linux-x06_x64.AppImage'
  );
});

$(".download-update.button").click(function () {
  shell.openExternal(
    `https://github.com/${repoAccount}/architect-downloader-gui/releases/latest`
  );
});

function checkUpdate(account, noAlert = false) {
  $(".ui.dashboard .about.dimmer").addClass("active");
  $.getJSON(
    `https://api.github.com/repos/${account}/architect-downloader-gui/releases/latest`,
    function (response) {
      $(".ui.dashboard .about.dimmer").removeClass("active");
      if (response.tag_name != `v${appVersion}`) {
        repoAccount = account;
        $(".ui.update-available.modal").modal("show");
      } else {
        if (noAlert == false) {
          prompt.alert(translate("No updates available"));
        }
      }
    }
  );
}


$(".ui.dashboard .content .objects.section .search.form").submit(function (e) {
  e.preventDefault();
  var keyword = $(e.target)
    .find("input")
    .val();
  if (validURL(keyword)) {
    if (keyword.search(new RegExp("^(http|https)"))) {
      keyword = "http://" + keyword;
    }
    $.ajax({
      type: "GET",
      url: keyword,
      beforeSend: function () {
        $(".ui.dashboard .object.dimmer").addClass("active");
      },
      headers: headers,
      success: function (response) {
        $(".ui.dashboard .object.dimmer").removeClass("active");
        var keyword = $(".main-content h1.clp-lead__title", response)
          .text()
          .trim();
        if (typeof keyword != "undefined" && keyword != "") {
          search(keyword, headers);
        } else {
          $(".ui.dashboard .objects.dimmer").removeClass("active");
          $(".ui.dashboard .ui.objects.section .disposable").remove();
          $(".ui.dashboard .ui.objects.section .ui.objects.items").empty();
          $(".ui.dashboard .ui.objects.section .ui.objects.items").append(
            `<div class="ui yellow message disposable">${translate("No objects Found")}</div>`
          );
        }
      },
      error: function () {
        $(".ui.dashboard .objects.dimmer").removeClass("active");
        $(".ui.dashboard .ui.objects.section .disposable").remove();
        $(".ui.dashboard .ui.objects.section .ui.objects.items").empty();
        $(".ui.dashboard .ui.objects.section .ui.objects.items").append(
          `<div class="ui yellow message disposable">${translate("No objects Found")}</div>`
        );
      }
    });
  } else {
    search(keyword, headers);
  }
});


$(".ui.dashboard .content").on("click", ".download-success, .object-encrypted", function () {
  $(this).hide();
  $(this)
    .parents(".object")
    .find(".download-status")
    .show();
});

$(".ui.dashboard .content").on("click", ".download.button, .download-error", function (e) {
  e.stopImmediatePropagation();
  var $object = $(this).parents(".object");
  downloadButtonClick($object);
});

function downloadButtonClick($object, subtitle) {
  var objectid = $object.attr("object-id");
  $object.find(".download-error").hide();
  $object.find(".object-encrypted").hide();
  $object.find(".download-status").show();
  $object.find(".info-downloaded").hide();
  $object.find(".icon-encrypted").hide();
  $object.find(".ui.tiny.image .tooltip").hide();
  $object.find(".ui.tiny.image").removeClass("wrapper");
  $object.find('input[name="encryptedObjects"]').val(0);
  
  var skipAttachments = settingsCached.download.skipAttachments;
  var skipSubtitles = settingsCached.download.skipSubtitles;
  var defaultSubtitle = subtitle ? subtitle : settingsCached.download.defaultSubtitle;

  // clique do botão iniciar download
  $.ajax({
    type: "GET",
    url: `https://${subDomain}.architect.com/api-1.0/objects/${objectid}/cached-subscriber-curriculum-items?page_size=10000`,
    beforeSend: function () {
      $(".ui.dashboard .object.dimmer").addClass("active");
    },
    headers: headers,
    success: function (response) {
      $(".ui.dashboard .object.dimmer").removeClass("active");
      $object.find(".download.button").addClass("disabled");
      $object.css("padding-bottom", "25px");
      $object.find(".ui.progress").show();

      debugger
      var objectdata = [];
      objectdata["id"] = objectid;
      objectdata["Objects"] = [];
      objectdata["name"] = $object.find(".objectname").text();
      objectdata["totalObjects"] = 0;
      objectdata["encryptedObjects"] = 0;
      objectdata["errorCount"] = 0;

      var objectindex = -1;
      var objectindex = -1;
      var remaining = response.count;
      var availableSubs = [];

      if (response.results[0]._class == "Object") {
        objectindex++;
        objectindex = 0;
        objectdata["Objects"][objectindex] = [];
        objectdata["Objects"][objectindex]["name"] = "Chapter 1";
        objectdata["Objects"][objectindex]["Objects"] = [];
        remaining--;
      }

      $.each(response.results, function (i, v) {

        if (v._class.toLowerCase() == "chapter") {
          objectindex++;
          objectindex = 0;
          objectdata["Objects"][objectindex] = [];
          objectdata["Objects"][objectindex]["name"] = v.title;
          objectdata["Objects"][objectindex]["Objects"] = [];
          remaining--;
        }
        else if (
          v._class.toLowerCase() == "Object" &&
          (v.asset.asset_type.toLowerCase() == "object" ||
            v.asset.asset_type.toLowerCase() == "Object" ||
            v.asset.asset_type.toLowerCase() == "file" ||
            v.asset.asset_type.toLowerCase() == "object")
        ) {
          if (v.asset.asset_type.toLowerCase() != "object" && skipAttachments) {
            remaining--;
            if (!remaining) {
              if (Object.keys(availableSubs).length) {
                askForSubtitle(availableSubs, initDownload, $object, objectdata, defaultSubtitle);
              } else {
                initDownload($object, objectdata);
              }
            }
            return;
          }

          function get object(Objectname, objectindex, objectindex) {
            $.ajax({
              type: "GET",
              url: `https://${subDomain}.architect.com/api-1.0/users/me/subscribed-objects/${objectid}/Objects/${v.id}?fields[Object]=asset,supplementary_assets&fields[asset]=stream_urls,download_urls,captions,title,filename,data,body,media_sources,media_license_token`,
              headers: headers,
              success: function (response) {
              
                if (v.asset.asset_type.toLowerCase() == "Object") {
                  if (response.asset.data) {
                    var src = response.asset.data.body;
                  }
                  else {
                    var src = response.asset.body;
                  }
                  var videoQuality = v.asset.asset_type;
                  var type = "Object";
                }
                else if (
                  v.asset.asset_type.toLowerCase() == "file" ||
                  v.asset.asset_type.toLowerCase() == "object"
                ) {
                  var src = response.asset.download_urls[v.asset.asset_type][0].file;
                  var videoQuality = v.asset.asset_type;
                  var type = "File";
                }
                else {
                  var type = "object";
                  var qualities = [];
                  var qualitySrcMap = {};

                  const medias = response.asset.stream_urls?.Video ?? response.asset.media_sources;
                  medias.forEach(function (val) {
                    if (val.label.toLowerCase() != "auto") {
                      qualities.push(val.label);
                      qualitySrcMap[val.label] = val.file ?? val.src;
                    }
                  });

                  const lowest = Math.min(...qualities);
                  const highest = Math.max(...qualities);
                  var src = medias[0].src ?? medias[0].file;
                  var videoQuality = qualities.length == 0 ? "Auto" : settingsCached.download.videoQuality;
                  
                    switch (videoQuality?.toLowerCase()) {
                      case "auto":                        
                        videoQuality = medias[0].label;
                        break;
                      case "highest":
                        src = qualitySrcMap[highest];
                        videoQuality = highest;
                        break;
                      case "lowest":
                        src = qualitySrcMap[lowest];
                        videoQuality = lowest;
                        break;
                      default:
                        videoQuality = videoQuality.slice(0, -1);
                        if (qualitySrcMap[videoQuality]) {
                          src = qualitySrcMap[videoQuality];
                        } else {                          
                          videoQuality = medias[0].label;
                        }
                    }
                  
                }

                objectdata["Objects"][objectindex]["Objects"][objectindex] = {
                  src: src,
                  name: Objectname,
                  quality: videoQuality,
                  type: type
                };

                if (!skipSubtitles && response.asset.captions.length) {
                  objectdata["Objects"][objectindex]["Objects"][objectindex].caption = [];

                  response.asset.captions.forEach(function (caption) {
                    caption.video_label in availableSubs
                      ? (availableSubs[caption.video_label] = availableSubs[caption.video_label] + 1)
                      : (availableSubs[caption.video_label] = 1);

                    objectdata["Objects"][objectindex]["Objects"][objectindex].caption[caption.video_label] = caption.url;
                  });
                }

                if (response.supplementary_assets.length && !skipAttachments) {
                  objectdata["Objects"][objectindex]["Objects"][objectindex]["supplementary_assets"] = [];
                  var supplementary_assets_remaining = response.supplementary_assets.length;

                  $.each(response.supplementary_assets, function (a, b) {
                    $.ajax({
                      type: "GET",
                      url: `https://${subDomain}.architect.com/api-1.0/users/me/subscribed-objects/${objectid}/Objects/${v.id}/supplementary-assets/${b.id}?fields[asset]=download_urls,external_url,asset_type`,
                      headers: headers,
                      success: function (response) {
                        if (response.download_urls) {
                          objectdata["Objects"][objectindex]["Objects"][objectindex]["supplementary_assets"]
                            .push({
                              src: response.download_urls[response.asset_type][0].file,
                              name: b.title,
                              quality: "Attachment",
                              type: "File"
                            });
                        } else {
                          objectdata["Objects"][objectindex]["Objects"][objectindex]["supplementary_assets"]
                            .push({
                              src: `<script type="text/javascript">window.location = "${response.external_url}";</script>`,
                              name: b.title,
                              quality: "Attachment",
                              type: "Url"
                            });
                        }
                        supplementary_assets_remaining--;
                        if (!supplementary_assets_remaining) {
                          remaining--;
                          objectdata["totalObjects"] += 1;

                          if (!remaining) {
                            if (Object.keys(availableSubs).length) {
                              askForSubtitle(availableSubs, initDownload, $object, objectdata, defaultSubtitle);
                            } else {
                              initDownload($object, objectdata);
                            }
                          }
                        }
                      }
                    });
                  });
                }
                else {
                  remaining--;
                  objectdata["totalObjects"] += 1;

                  if (!remaining) {
                    if (Object.keys(availableSubs).length) {
                      askForSubtitle(availableSubs, initDownload, $object, objectdata, defaultSubtitle);
                    } else {
                      initDownload($object, objectdata);
                    }
                  }
                }
              }
            });
          }
          get Object(v.title, objectindex, objectindex);
          objectindex++;
        }
        else if (!skipAttachments) {
          //debugger;
          objectdata["Objects"][objectindex]["Objects"][objectindex] = {
            src: `<script type="text/javascript">
                    window.location = "https://${subDomain}.architect.com${$object.attr("object-url")}t/${v._class}/${v.id}";
                  </script>`,
            name: v.title,
            quality: "Attachment",
            type: "Url"
          };
          remaining--;
          objectdata["totalObjects"] += 1;

          if (!remaining) {
            if (Object.keys(availableSubs).length) {
              askForSubtitle(availableSubs, initDownload, $object, objectdata, defaultSubtitle);
            } else {
              initDownload($object, objectdata);
            }
          }
          objectindex++;
        } else {
          remaining--;

          if (!remaining) {
            if (Object.keys(availableSubs).length) {
              askForSubtitle(availableSubs, initDownload, $object, objectdata, defaultSubtitle);
            } else {
              initDownload($object, objectdata);
            }
          }
        }
      });
    },
    error: function (error) {
      $(".ui.dashboard .object.dimmer").removeClass("active");
      if (error.status == 403) {
        prompt.alert(
          translate("You do not have permission to access this object")
        );
      }
    }
  });
}

function initDownload($object, objectdata, subTitle = "") {
  var $clone = $object.clone();
  var subtitle = (Array.isArray(subTitle) ? subTitle[0] : subTitle).split('|');
  var $downloads = $(".ui.downloads.section .ui.objects.items");
  var $objects = $(".ui.objects.section .ui.objects.items");

  $object.find('input[name="selectedSubtitle"]').val(subtitle);
  if ($object.parents(".objects.section").length) {
    $downloadItem = $downloads.find("[object-id=" + $object.attr("object-id") + "]");
    if ($downloadItem.length) {
      $downloadItem.replaceWith($clone);
    } else {
      $downloads.prepend($clone);
    }
  } else {
    $objectItem = $objects.find("[object-id=" + $object.attr("object-id") + "]");
    if ($objectItem.length) {
      $objectItem.replaceWith($clone);
    }
  }
  $object.push($clone[0]);
  var timer;
  var downloader = new Downloader();
  var $actionButtons = $object.find(".action.buttons");
  var $pauseButton = $actionButtons.find(".pause.button");
  var $resumeButton = $actionButtons.find(".resume.button");
  var ObjectChaperMap = {};
  var qualityColorMap = {
    144: "red",
    240: "orange",
    360: "blue",
    400: "teal",
    720: "olive",
    1000: "green",
    auto: "purple",
    Attachment: "pink",
    Subtitle: "black"
  };
  var currentObject = 0;
  objectdata["Objects"].forEach(function (Object, objectindex) {
    Object["Objects"].forEach(function (x, objectindex) {
      currentObject++;
      ObjectChaperMap[currentObject] = {
        objectindex: objectindex,
        objectindex: objectindex
      };
    });
  });

  var object_name = sanitize(objectdata["name"]);
  var totalObjects = objectdata["totalObjects"];
  var $progressElemCombined = $object.find(".combined.progress");
  var $progressElemIndividual = $object.find(".individual.progress");
  var download_directory = getPathDownloadsSetting();
  var $download_speed = $object.find(".download-speed");
  var $download_speed_value = $download_speed.find(".value");
  var $download_speed_unit = $download_speed.find(".download-unit");
  var $download_quality = $object.find(".download-quality");
  var downloaded = 0;
  var downloadStart = settingsCached.download.downloadStart;
  var downloadEnd = settingsCached.download.downloadEnd;
  var enableDownloadStartEnd = settingsCached.download.enableDownloadStartEnd;

  $object
    .css("cssText", "padding-top: 35px !important")
    .css("padding-bottom", "25px");

  $object.find('input[name="path-downloaded"]').val(`${download_directory}/${object_name}`);
  $object.find('.open-dir.button').show();

  $pauseButton.click(function () {
    stopDownload();
  });

  $resumeButton.click(function () {
    downloader._downloads[downloader._downloads.length - 1].resume();
    $resumeButton.addClass("disabled");
    $pauseButton.removeClass("disabled");
  });

  if (enableDownloadStartEnd) {
    if (downloadStart > downloadEnd) {
      downloadStart = downloadEnd;
    }

    if (downloadStart < 1) {
      downloadStart = 1;
    } else if (downloadStart > totalObjects) {
      downloadStart = totalObjects;
    }

    if (downloadEnd < 1 || downloadEnd > totalObjects) {
      downloadEnd = totalObjects;
    }

    var toDownload = downloadEnd - downloadStart + 1;
    downloadChapter(
      ObjectChaperMap[downloadStart].objectindex,
      ObjectChaperMap[downloadStart].objectindex
    );

  } else {
    var toDownload = totalObjects;
    downloadChapter(0, 0);
  }

  $progressElemCombined.progress({
    total: toDownload,
    text: {
      active: `${translate("Downloaded")} {value} ${translate("out of")} {total} ${translate("items")}`
    }
  });

  $progressElemCombined.progress("reset");
  $download_speed.show();
  $download_quality.show();
  $object.find(".info-downloaded").hide();

  function stopDownload(isEncryptedVideo) {
    downloader._downloads[downloader._downloads.length - 1].stop();
    $pauseButton.addClass("disabled");
    $resumeButton.removeClass("disabled");

    if (isEncryptedVideo) {
      resetobject($object, $object.find(".object-encrypted"));
    }
  }

  function downloadChapter(objectindex, objectindex) {
    const num_Objects = objectdata["Objects"][objectindex]["Objects"].length;
    const seqName = getSequenceName(
      objectindex + 1,
      objectdata["Objects"].length,
      objectdata["Objects"][objectindex]["name"].trim(),
      ". ",
      download_directory + "/" + object_name
    );

    mkdirp(
      seqName.fullPath,
      function () {
        downloadObject(objectindex, objectindex, num_Objects, seqName.name);
      }
    );
  }

  function downloadObject(objectindex, objectindex, num_Objects, chapter_name) {
    if (downloaded == toDownload) {
      resetobject($object, $object.find(".download-success"));
      sendNotification(download_directory + "/" + object_name, object_name, $object.find(".ui.tiny.image").find(".object-image").attr("src"));
      return;
    } else if (objectindex == num_Objects) {
      downloadChapter(++objectindex, 0);
      return;
    }

    const ObjectType = objectdata["Objects"][objectindex]["Objects"][objectindex]["type"].toLowerCase();
    const ObjectName = objectdata["Objects"][objectindex]["Objects"][objectindex]["name"].trim();

    function dlStart(dl, typeVideo, callback) {
      // Change retry options to something more forgiving and threads to keep architect from getting upset
      dl.setRetryOptions({
        maxRetries: 3,		// Default: 5
        retryInterval: 3000 // Default: 2000
      });

      // Set download options
      dl.setOptions({
        threadsCount: 5, // Default: 2, Set the total number of download threads
        timeout: 5000,   // Default: 5000, If no data is received, the download times out (milliseconds)
        range: '0-100',  // Default: 0-100, Control the part of file that needs to be downloaded.
      });

      dl.start();
      // To track time and restarts
      let notStarted = 0;
      let reStarted = 0;

      timer = setInterval(function () {
        // Status:
        //   -3 = destroyed
        //   -2 = stopped
        //   -1 = error
        //   0 = not started
        //   1 = started (downloading)
        //   2 = error, retrying
        //   3 = finished
        switch (dl.status) {
          case 0:
            // Wait a reasonable amount of time for the download to start and if it doesn't then start another one.
            // once one of them starts the errors from the others will be ignored and we still get the file.
            if (reStarted <= 5) {
              notStarted++;
              if (notStarted >= 15) {
                dl.start();
                notStarted = 0;
                reStarted++;
              }
            }
            $download_speed_value.html(0);
            break;

          case 1:
          case -1:
            var stats = dl.getStats();
            var download_speed_and_unit = getDownloadSpeed(parseInt(stats.present.speed / 1000) || 0);
            $download_speed_value.html(download_speed_and_unit.value);
            $download_speed_unit.html(download_speed_and_unit.unit);
            $progressElemIndividual.progress("set percent", stats.total.completed);

            if (dl.status === -1
              && dl.stats.total.size == 0
              && fs.existsSync(dl.filePath)
            ) {
              dl.emit("end");
              clearInterval(timer);
            }
            else if (dl.status === -1) {
              $.ajax({
                type: "HEAD",
                url: dl.url,
                error: function (error) {
                  if (error.status == 401 || error.status == 403) {
                    fs.unlinkSync(dl.filePath);
                  }
                  resetobject($object, $object.find(".download-error"), settingsCached.download.autoRetry, objectdata, subtitle);
                },
                success: function () {
                  resetobject($object, $object.find(".download-error"), settingsCached.download.autoRetry, objectdata, subtitle);
                }
              });
              clearInterval(timer);
            }
            break;

          case 2:
            break;
          default:
            $download_speed_value.html(0);
        }
      }, 1000);

      dl.on("error", function (dl) {
        console.error('errorDownload', dl.error.message);
      });

      dl.on("start", function () {
        let file = (dl.filePath.split("/").slice(-2).join("/"));
        
        console.log("startDownload", file);
        $pauseButton.removeClass("disabled");
      });

      dl.on("stop", function () {
        console.warn("stopDownload");
        $pauseButton.removeClass("disabled");
      });

      dl.on("end", function () {
        if (typeVideo && dl.meta.size < corruptedOBJSize) {
          $object.find('input[name="encryptedObjects"]').val(++objectdata.encryptedObjects);
          console.warn(`${objectdata.encryptedObjects} - encryptedObjects`, dl.filePath)

          if (!settingsCached.download.continueDonwloadingEncrypted) {
            stopDownload(translate("Contains encrypted Objects"));
            dl.destroy();
            return;
          }
        }
        callback();
      });
    }

    function downloadAttachments(index, total_assets) {
      $progressElemIndividual.progress("reset");

      const attachment = objectdata["Objects"][objectindex]["Objects"][objectindex]["supplementary_assets"][index];
      const attachmentName = attachment["name"].trim();

      var ObjectQuality = attachment["quality"];
      var lastClass = $download_quality.attr("class").split(" ").pop();

      $download_quality
        .html(ObjectQuality)
        .removeClass(lastClass)
        .addClass(qualityColorMap[ObjectQuality] || "grey");

      if (attachment["type"] == "Object" || attachment["type"] == "Url") {
        const wfDir = download_directory + "/" + object_name + "/" + chapter_name;
        fs.writeFile(
          getSequenceName(
            objectindex + 1,
            num_Objects,
            attachmentName + ".html",
            `.${index + 1} `,
            wfDir).fullPath,
          attachment["src"],
          function () {
            index++;
            if (index == total_assets) {
              $progressElemCombined.progress("increment");
              downloaded++;
              downloadObject(objectindex, ++objectindex, num_Objects, chapter_name);
            }
            else {
              downloadAttachments(index, total_assets);
            }
          }
        );
      }
      else {
        //Download anexos
        let fileExtension = attachment.src.split("/").pop().split("?").shift().split(".").pop();
        fileExtension = attachment.name.split(".").pop() == fileExtension ? "" : "." + fileExtension;

        const seqName = getSequenceName(
          objectindex + 1,
          num_Objects,
          attachmentName + fileExtension,
          `.${index + 1} `,
          `${download_directory}/${object_name}/${chapter_name}`);

        if (fs.existsSync(seqName.fullPath + ".mtd") && !fs.statSync(seqName.fullPath + ".mtd").size) {
          fs.unlinkSync(seqName.fullPath + ".mtd");
        }

        if (fs.existsSync(seqName.fullPath + ".mtd")) {
          var dl = downloader.resumeDownload(seqName.fullPath);
        }
        else if (fs.existsSync(seqName.fullPath)) {
          endDownload();
          return;
        }
        else {
          var dl = downloader.download(attachment["src"], seqName.fullPath);
        }

        dlStart(dl, attachment["type"] == "object", endDownload);


        function endDownload() {
          index++;
          
          clearInterval(timer);
          if (index == total_assets) {
            $progressElemCombined.progress("increment");
            downloaded++;
            downloadObject(objectindex, ++objectindex, num_Objects, chapter_name);
          } else {
            downloadAttachments(index, total_assets);
          }
        }
      }
    }

    function checkAttachment() {
      $progressElemIndividual.progress("reset");
      const attachment = objectdata["Objects"][objectindex]["Objects"][objectindex]["supplementary_assets"]

      if (attachment) {
        // order by name
        objectdata["Objects"][objectindex]["Objects"][objectindex]["supplementary_assets"].sort(dynamicSort("name"));

        var total_assets = attachment.length;
        var index = 0;
        downloadAttachments(index, total_assets);
      }
      else {
        $progressElemCombined.progress("increment");
        downloaded++;
        downloadObject(objectindex, ++objectindex, num_Objects, chapter_name);
      }
    }

    function downloadSubtitle() {
      $progressElemIndividual.progress("reset");
      var lastClass = $download_quality
        .attr("class")
        .split(" ")
        .pop();
      $download_quality
        .html("Subtitle")
        .removeClass(lastClass)
        .addClass(qualityColorMap["Subtitle"] || "grey");
      $download_speed_value.html(0);

      const seqName = getSequenceName(
        objectindex + 1,
        num_Objects,
        ObjectName + ".srt",
        ". ",
        `${download_directory}/${object_name}/${chapter_name}`
      );

      if (fs.existsSync(seqName.fullPath)) {
        checkAttachment();
        return;
      }
      const vttFile = seqName.fullPath.replace(".srt", ".vtt");

      var file = fs.createWriteStream(vttFile).on("finish", function () {
        var finalSrt = fs.createWriteStream(seqName.fullPath).on("finish", function () {
          fs.unlinkSync(vttFile);
          checkAttachment();
        });

        fs.createReadStream(vttFile)
          .pipe(vtt2srt())
          .pipe(finalSrt);
      });

      var caption = objectdata["Objects"][objectindex]["Objects"][objectindex]["caption"];
      var available = [];
      $.map(subtitle, function (el) {
        if (el in caption) {
          available.push(el);
        }
      })

      var download_this_sub = available[0] || Object.keys(caption)[0] || "";
      // Prefer non "[Auto]" subs (likely entered by the creator of the Object.)
      if (available.length > 1) {
        for (key in available) {
          if (
            available[key].indexOf("[Auto]") == -1
            || available[key].indexOf(`[${translate("Auto")}]`) == -1
          ) {
            download_this_sub = available[key];
            break;
          }
        }
      }

      // Per Object: download maximum 1 of the language.
      var request = https.get(
        // objectdata["Objects"][objectindex]["Objects"][objectindex][
        //   "caption"
        // ][subtitle]
        //   ? objectdata["Objects"][objectindex]["Objects"][objectindex][
        //       "caption"
        //     ][subtitle]
        //   : objectdata["Objects"][objectindex]["Objects"][objectindex][
        //       "caption"
        //     ][
        //       Object.keys(
        //         objectdata["Objects"][objectindex]["Objects"][objectindex][
        //           "caption"
        //         ]
        //       )[0]
        //     ],
        caption[download_this_sub],
        function (response) {
          response.pipe(file);
        }
      );
    }

    $progressElemIndividual.progress("reset");

    var ObjectQuality = objectdata["Objects"][objectindex]["Objects"][objectindex]["quality"];
    var lastClass = $download_quality.attr("class").split(" ").pop();
    $download_quality.html(
      ObjectQuality + (ObjectType == "object" ? "p" : "")
    ).removeClass(
      lastClass
    ).addClass(qualityColorMap[ObjectQuality] || "grey");

    if (ObjectType == "Object" || ObjectType == "url") {
      const wfDir = `${download_directory}/${object_name}/${chapter_name}`;
      fs.writeFile(
        getSequenceName(objectindex + 1, num_Objects, ObjectName + ".html", ". ", wfDir).fullPath,
        objectdata["Objects"][objectindex]["Objects"][objectindex]["src"],
        function () {
          if (
            objectdata["Objects"][objectindex]["Objects"][objectindex]["supplementary_assets"]
          ) {
            objectdata["Objects"][objectindex]["Objects"][objectindex]["supplementary_assets"].sort(dynamicSort("name"));
            var total_assets = objectdata["Objects"][objectindex]["Objects"][objectindex]["supplementary_assets"].length;
            var index = 0;
            downloadAttachments(index, total_assets);
          }
          else {
            $progressElemCombined.progress("increment");
            downloaded++;
            downloadObject(objectindex, ++objectindex, num_Objects, chapter_name);
          }
        }
      );
    }
    else {
      const seqName = getSequenceName(
        objectindex + 1,
        num_Objects,
        ObjectName + (ObjectType == "file" ? ".pdf" : ".OBJ"),
        ". ",
        `${download_directory}/${object_name}/${chapter_name}`
      );

      if (fs.existsSync(seqName.fullPath + ".mtd") && !fs.statSync(seqName.fullPath + ".mtd").size) {
        fs.unlinkSync(seqName.fullPath + ".mtd");
      }

      if (fs.existsSync(seqName.fullPath + ".mtd")) {
        var dl = downloader.resumeDownload(seqName.fullPath);
      }
      else if (fs.existsSync(seqName.fullPath)
      ) {
        endDownloadAttachment();
        return;
      }
      else {
        var dl = downloader.download(objectdata["Objects"][objectindex]["Objects"][objectindex]["src"], seqName.fullPath);
      }

      dlStart(dl, ObjectType == "object", endDownloadAttachment);

      function endDownloadAttachment() {
        clearInterval(timer);
        if (
          objectdata["Objects"][objectindex]["Objects"][objectindex].caption
        ) {
          downloadSubtitle();
        } else {
          checkAttachment();
        }
      }
    }
  }
}

function resetobject($object, $elMessage, autoRetry, objectdata, subtitle) {
  if ($elMessage.hasClass("download-success")) {
    $object.attr('object-completed', true);
  }
  else {
    $object.attr('object-completed', '');

    if ($elMessage.hasClass("download-error")) {
      if (autoRetry && objectdata.errorCount++ < 5) {
        $object.length = 1;
        initDownload($object, objectdata, subtitle);
        return;
      }
    }
  }

  $object.find(".download-quality").hide();
  $object.find(".download-speed").hide().find(".value").html(0);
  $object.find(".download-status").hide().html(downloadTemplate);
  $object.css("padding", "14px 0px");
  $elMessage.css("display", "flex");
}

$(".objects-sidebar").click(function () {
  $(".content .ui.section").hide();
  $(".content .ui.objects.section").show();
  $(this).parent(".sidebar").find(".active").removeClass("active purple");
  $(this).addClass("active purple");
});

$(".downloads-sidebar").click(function () {
  $(".ui.dashboard .downloads.dimmer").addClass("active");
  $(".content .ui.section").hide();
  $(".content .ui.downloads.section").show();
  $(this).parent(".sidebar").find(".active").removeClass("active purple");
  $(this).addClass("active purple");

  rendererDownloads();
});

$(".settings-sidebar").click(function () {
  $(".content .ui.section").hide();
  $(".content .ui.settings.section").show();
  $(this).parent(".sidebar").find(".active").removeClass("active purple");
  $(this).addClass("active purple");

  loadSettings();
});

$(".about-sidebar").click(function () {
  $(".content .ui.section").hide();
  $(".content .ui.about.section").show();
  $(this).parent(".sidebar").find(".active").removeClass("active purple");
  $(this).addClass("active purple");
});

$(".logout-sidebar").click(function () {
  prompt.confirm(translate("Confirm Log Out?"), function (ok) {
    if (ok) {
      $(".ui.logout.dimmer").addClass("active");
      saveDownloads(false);
      settings.set("access_token", null);
      resetToLogin();
    }
  });
});

$(".content .ui.about").on("click", 'a[href^="http"]', function (e) {
  e.preventDefault();
  shell.openExternal(this.href);
});

$(".ui.settings .form").submit(e => {
  e.preventDefault();

  var checkNewVersion = $(e.target).find('input[name="check-new-version"]')[0].checked ?? true;
  var autoStartDownload = $(e.target).find('input[name="auto-start-download"]')[0].checked ?? false;
  var continueDonwloadingEncrypted = $(e.target).find('input[name="continue-downloading-encrypted"]')[0].checked ?? false;
  var enableDownloadStartEnd = $(e.target).find('input[name="enabledownloadstartend"]')[0].checked ?? false;
  var skipAttachments = $(e.target).find('input[name="skipattachments"]')[0].checked ?? false;
  var skipSubtitles = $(e.target).find('input[name="skipsubtitles"]')[0].checked ?? false;
  var autoRetry = $(e.target).find('input[name="autoretry"]')[0].checked ?? false;
  var downloadStart = parseInt($(e.target).find('input[name="downloadstart"]').val()) ?? false;
  var downloadEnd = parseInt($(e.target).find('input[name="downloadend"]').val()) ?? false;
  var videoQuality = $(e.target).find('input[name="videoquality"]').val() ?? false;
  var downloadPath = $(e.target).find('input[name="downloadpath"]').val() ?? false;
  var language = $(e.target).find('input[name="language"]').val() ?? false;
  var defaultSubtitle = $(e.target).find('input[name="defaultSubtitle"]').val() ?? false;
  var seqZeroLeft = $(e.target).find('input[name="seq-zero-left"]')[0].checked ?? false;

  settings.set("download", {
    checkNewVersion: checkNewVersion,
    autoStartDownload: autoStartDownload,
    continueDonwloadingEncrypted: continueDonwloadingEncrypted,
    enableDownloadStartEnd: enableDownloadStartEnd,
    skipAttachments: skipAttachments,
    skipSubtitles: skipSubtitles,
    autoRetry: autoRetry,
    downloadStart: downloadStart,
    downloadEnd: downloadEnd,
    videoQuality: videoQuality,
    path: downloadPath,
    defaultSubtitle: defaultSubtitle,
    seqZeroLeft: seqZeroLeft,
  });

  settings.set("general", {
    language: language
  });

  settingsCached = settings.getAll();

  prompt.alert(translate("Settings Saved"));
});

var settingsForm = $(".ui.settings .form");

function loadSettings() {

  settingsForm.find('input[name="check-new-version"]').prop("checked", settingsCached.download.checkNewVersion ?? false);
  settingsForm.find('input[name="auto-start-download"]').prop("checked", settingsCached.download.autoStartDownload ?? false);
  settingsForm.find('input[name="continue-downloading-encrypted"]').prop("checked", settingsCached.download.continueDonwloadingEncrypted ?? false);

  settingsForm.find('input[name="enabledownloadstartend"]').prop("checked", settingsCached.download.enableDownloadStartEnd ?? false);
  settingsForm.find('input[name="downloadstart"], input[name="downloadend"]').prop("readonly", settingsCached.download.enableDownloadStartEnd ?? false);

  settingsForm.find('input[name="skipattachments"]').prop("checked", settingsCached.download.skipAttachments ?? false);
  settingsForm.find('input[name="skipsubtitles"]').prop("checked", settingsCached.download.skipSubtitles ?? false);
  settingsForm.find('input[name="autoretry"]').prop("checked", settingsCached.download.autoRetry ?? false);
  settingsForm.find('input[name="seq-zero-left"]').prop("checked", settingsCached.download.seqZeroLeft ?? false);

  settingsForm.find('input[name="downloadpath"]').val(getPathDownloadsSetting());
  settingsForm.find('input[name="downloadstart"]').val(settingsCached.download.downloadStart || "");
  settingsForm.find('input[name="downloadend"]').val(settingsCached.download.downloadEnd || "");

  var videoQuality = settingsCached.download.videoQuality;
  settingsForm.find('input[name="videoquality"]').val(videoQuality || "");
  settingsForm.find('input[name="videoquality"]')
    .parent(".dropdown")
    .find(".default.text")
    .html(videoQuality || translate("Auto"));

  var language = settingsCached.general.language;
  settingsForm.find('input[name="language"]').val(language || "");
  settingsForm.find('input[name="language"]')
    .parent(".dropdown")
    .find(".default.text")
    .html(language || "English");

  var defaultSubtitle = settingsCached.download.defaultSubtitle;
  settingsForm.find('input[name="defaultSubtitle"]').val(defaultSubtitle || "");
  settingsForm.find('input[name="defaultSubtitle"]')
    .parent(".dropdown")
    .find(".defaultSubtitle.text")
    .html(defaultSubtitle || "");
}

settingsForm.find('input[name="enabledownloadstartend"]').change(function () {
  debugger;
  settingsForm.find('input[name="downloadstart"], input[name="downloadend"]').prop("readonly", !this.checked);
});

function selectDownloadPath() {
  const path = dialog.showOpenDialogSync({
    properties: ["openDirectory"]
  });

  if (path[0]) {
    fs.access(path[0], fs.R_OK && fs.W_OK, function (err) {
      if (err) {
        prompt.alert(translate("Cannot select this folder"));
      } else {
        settingsForm.find('input[name="downloadpath"]').val(path[0]);
      }
    });
  }
}

function rendererobject(response, keyword = "") {
  $(".ui.dashboard .objects.dimmer").removeClass("active");
  $(".ui.dashboard .ui.objects.section .disposable").remove();
  $(".ui.dashboard .ui.objects.section .ui.objects.items").empty();
  if (response.results.length) {
    $.each(response.results, function (index, object) {
      $(".ui.dashboard .ui.objects.section .ui.objects.items").append(
        htmlobjectCard(object)
      );
    });
    if (response.next) {
      $(".ui.objects.section").append(
        `<button class="ui basic blue fluid load-more button disposable" data-url=${response.next}>
          ${translate("Load More")}
        </button>`
      );
    }
  } else {
    $(".ui.dashboard .ui.objects.section .ui.objects.items").append(
      `<div class="ui yellow message disposable">
        ${translate("No objects Found")}
      </div>`
    );
  }

}

function rendererDownloads() {
  if ($(".ui.downloads.section .ui.objects.items .ui.object.item").length) {
    return;
  }
  if ((downloaded objects = settings.get("downloaded objects"))) {
    downloaded objects.forEach(function (object) {
      $object = htmlobjectCard(object, true);
      $(".ui.downloads.section .ui.objects.items").append($object);
      if (!object.completed && settingsCached.download.autoStartDownload) {
        debugger;
        downloadButtonClick($object, object.selectedSubtitle);
        var $pauseButton = $object.find(".action.buttons").find(".pause.button");
        $pauseButton.removeClass("disabled");
      }
    });
  }
}

function addDownloadHistory(objectId, completed = false, encryptedObjects = 0, selectedSubtitle = "", pathDownloaded = "") {
  var item = undefined;
  const items = getAllDownloadsHistory() ?? [];

  completed = Boolean(completed);

  if (items.length > 0) {
    item = items.find(x => x.id == objectId);
  }

  if (item) {
    if (completed !== item.completed) {
      item.completed = completed;
      item.date = new Date(Date.now()).toLocaleDateString();
    }
    item.encryptedObjects = encryptedObjects;
    item.selectedSubtitle = selectedSubtitle;
    item.pathDownloaded = pathDownloaded;
  }
  else {
    item = {
      id: objectId,
      completed,
      date: new Date(Date.now()).toLocaleDateString(),
      encryptedObjects,
      selectedSubtitle,
      pathDownloaded
    }

    items.push(item)
  }

  settings.set("downloadedHistory", items);
}

function getAllDownloadsHistory() {
  return settings.get("downloadedHistory");
}

function getDownloadHistory(objectId) {
  try {
    const items = getAllDownloadsHistory() ?? [];

    if (items.length > 0) {
      return items.find(x => x.id == objectId);
    }

    return undefined;
  } catch (error) {
    return undefined;
  }
}

function saveDownloads(quit) {
  var downloaded objects = [];
  var $downloads = $(".ui.downloads.section .ui.objects.items .ui.object.item").slice(0);

  if ($downloads.length) {
    $downloads.each(function (index, elem) {
      $elem = $(elem);

      if ($elem.find(".progress.active").length) {
        var individualProgress = $elem.find(".download-status .individual.progress").attr("data-percent");
        var combinedProgress = $elem.find(".download-status .combined.progress").attr("data-percent");
        var completed = false;
      } else {
        var individualProgress = 0;
        var combinedProgress = 0;
        var completed = Boolean($elem.attr("object-completed"));
      }

      var object = {
        id: $elem.attr("object-id"),
        url: $elem.attr("object-url"),
        title: $elem.find(".objectname").text(),
        image: $elem.find(".image img").attr("src"),
        individualProgress: individualProgress,
        combinedProgress: combinedProgress,
        completed,
        progressStatus: $elem.find(".download-status .label").text(),
        encryptedObjects: $elem.find('input[name="encryptedObjects"]').val(),
        selectedSubtitle: $elem.find('input[name="selectedSubtitle"]').val(),
        pathDownloaded: $elem.find('input[name="path-downloaded"]').val()
      };

      downloaded objects.push(object);
      addDownloadHistory(object.id, completed, object.encryptedObjects, object.selectedSubtitle, object.pathDownloaded);
    });

    settings.set("downloaded objects", downloaded objects);
  }
  if (quit) {
    Architect3DGallery.ipcRenderer.send("quitApp");
  }
}

function removeCurseDownloads(objectId) {
  var $downloads = $(".ui.downloads.section .ui.objects.items .ui.object.item").slice(0);

  if ($downloads.length) {
    $downloads.each(function (index, elem) {
      $elem = $(elem);
      if ($elem.attr("object-id") == objectId) {
        $elem.remove();
      }
    });
  }
}


function validURL(value) {
  var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
  var regexp = new RegExp(expression);
  return regexp.test(value);
}

function search(keyword, headers) {
  $.ajax({
    type: "GET",
    url: `https://${subDomain}.architect.com/api-1.0/users/me/subscribed-objects?page_size=${pageSize}&page=1&fields[user]=job_title&search=${keyword}`,
    beforeSend: function () {
      $(".ui.dashboard .objects.dimmer").addClass("active");
    },
    headers: headers,
    success: function (response) {
      rendererobject(response, keyword);
    }
  });
}

function askForSubtitle(availableSubs, initDownload, $object, objectdata, defaultSubtitle = "") {
  var $subtitleModal = $(".ui.subtitle.modal");
  var $subtitleDropdown = $subtitleModal.find(".ui.dropdown");
  var subtitleLanguages = [];
  var languages = [];
  var totals = {};
  var languageKeys = {};

  defaultSubtitle = defaultSubtitle.replace('[Auto]', '').replace(`[${translate("Auto")}]`, '').trim();
  for (var key in availableSubs) {
    language = key.replace('[Auto]', '').replace(`[${translate("Auto")}]`, '').trim();

    // default subtitle exists 
    if (language === defaultSubtitle) {
      initDownload($object, objectdata, key);
      return;
    }

    if (!(language in totals)) {
      languages.push(language);
      totals[language] = 0;
      languageKeys[language] = [];
    }

    totals[language] += availableSubs[key];
    languageKeys[language].push(key);
  }

  // only a subtitle
  if (languages.length == 1) {
    initDownload($object, objectdata, languageKeys[0]);
    return;
  }

  for (var language in totals) {
    totals[language] = Math.min(objectdata['totalObjects'], totals[language]);
  }
  languages.sort();

  for (var key in languages) {
    var language = languages[key];
    subtitleLanguages.push({
      name: `<b>${language}</b> <i>${totals[language]} ${translate("Objects")}</i>`,
      value: languageKeys[language].join('|')
    });
  }

  $subtitleModal.modal({ closable: false }).modal("show");

  $subtitleDropdown.dropdown({
    values: subtitleLanguages,
    onChange: function (subtitle) {
      $subtitleModal.modal("hide");
      $subtitleDropdown.dropdown({ values: [] });
      initDownload($object, objectdata, subtitle);
    }
  });
}

function loginWitharchitect() {
  if ($(".ui.login .form").find('input[name="business"]').is(":checked")) {
    if (!$subDomain.val()) {
      prompt.alert("Type Business Name");
      return;
    }
  }
  else {
    $subDomain.val(null);
  }
  var parent = remote.getCurrentWindow();
  var dimensions = parent.getSize();
  var session = remote.session;
  let architectLoginWindow = new BrowserWindow({
    width: dimensions[0] - 100,
    height: dimensions[1] - 100,
    parent,
    modal: true
  });

  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ["*://*.architect.com/*"] },
    function (request, callback) {

      const token = request.requestHeaders.Authorization
        ? request.requestHeaders.Authorization.split(" ")[1]
        : cookie.parse(request.requestHeaders.Cookie || '').access_token;
      
      if (token) {
        settings.set("access_token", token);
        settings.set("subdomain", new URL(request.url).hostname.split(".")[0]);
        architectLoginWindow.destroy();
        session.defaultSession.clearStorageData();
        session.defaultSession.webRequest.onBeforeSendHeaders(
          { urls: ["*://*.architect.com/*"] },
          function (request, callback) {            
            callback({ requestHeaders: request.requestHeaders });
          }
        );
        checkLogin();
      }
      callback({ requestHeaders: request.requestHeaders });
    }
  );

  console.log('loginWitharchitect', $subDomain.val())
  
  if ($subDomain.val()) {
    architectLoginWindow.loadURL(`https://${$subDomain.val()}.architect.com`);
  } else {
    architectLoginWindow.loadURL("https://www.architect.com/join/login-popup");
  }

}

function checkLogin() {
  if (settings.get("access_token")) {
    $(".ui.login.grid").slideUp("fast");
    $(".ui.dashboard").fadeIn("fast").css("display", "flex");
    headers = { Authorization: `Bearer ${settings.get("access_token")}` };
    $.ajax({
      type: "GET",
      url: `https://${settings.get("subdomain")}.architect.com/api-1.0/users/me/subscribed-objects?page_size=${pageSize}`,
      beforeSend: function () {
        $(".ui.dashboard .objects.dimmer").addClass("active");
      },
      headers: headers,
      success: function (response) {
        if (settingsCached.download.checkNewVersion ?? false) {
          checkUpdate(repoAccount, true);
        }
        rendererobject(response);
        if (settings.get("downloaded objects")) {
          rendererDownloads()
        }

      },
      error: function (response) {
        if (response.status == 403) {
          settings.set("access_token", null);
        }
        resetToLogin();
      }
    });
  }
}


function loginWithPassword() {
  if ($(".ui.login .form").find('input[name="business"]').is(":checked")) {
    if (!$subDomain.val()) {
      prompt.alert("Type Business Name");
      return;
    }
  } else {
    $subDomain.val("www");
  }

  
  // prompt.prompt("Access Token", function (access_token) {
  //   if (access_token) {
  //     const submain = $subDomain.val();
  //     settings.set("access_token", access_token);
  //     settings.set("subdomain", submain.length == 0 ? "www" : submain);
  //     checkLogin();
  //   }
  // });
}

function loginWithAccessToken() {
  if ($(".ui.login .form").find('input[name="business"]').is(":checked")) {
    if (!$subDomain.val()) {
      prompt.alert("Type Business Name");
      return;
    }
  } else {
    $subDomain.val("www");
  }
  prompt.prompt("Access Token", function (access_token) {
    if (access_token) {
      const submain = $subDomain.val();
      settings.set("access_token", access_token);
      settings.set("subdomain", submain.length == 0 ? "www" : submain);
      checkLogin();
    }
  });
}

function resetToLogin() {
  $(".ui.dimmer").removeClass("active");
  $(".ui.dashboard .objects.items").empty();
  $(".content .ui.section").hide();
  $(".content .ui.objects.section").show();
  $(".sidebar").find(".active").removeClass("active purple");
  $(".sidebar").find(".objects-sidebar").addClass("active purple");
  $(".ui.login.grid").slideDown("fast");
  $(".ui.dashboard").fadeOut("fast");
}

// The purpose here is to have a notification sent, so the user can understand that the download ended
// The title of the notification should be translated but since the translate function is in index.html and to avoid code duplication
// I would like to have your feedback in this
function sendNotification(pathObject, object_name, urlImage = null) {
  var notification = new Notification(object_name, {
    body: 'Download finished',
    icon: urlImage ?? __dirname + "/assets/images/build/icon.png"
  });

  notification.onclick = function () {
    shell.openItem(pathObject);
  }
}

function getSequenceName(index, count, name, separatorIndex = ". ", path = null) {
  const sanitize_name = sanitize(name);

  const index_name = `${index}${separatorIndex}${sanitize_name}`;
  const index_path = path ? `${path}/${index_name}` : index_name;

  const seq = zeroPad(index, count);
  const sequence_name = `${seq}${separatorIndex}${sanitize_name}`;
  const sequence_path = path ? `${path}/${sequence_name}` : sequence_name;

  if (settingsCached.download.seqZeroLeft) {
    if (fs.existsSync(index_path)) {
      fs.renameSync(index_path, sequence_path);
    }

    return { name: sequence_name, fullPath: sequence_path };
  }
  else {
    if (fs.existsSync(sequence_path)) {
      fs.renameSync(sequence_path, index_path);
    }

    return { name: index_name, fullPath: index_path };
  }

}

function zeroPad(num, max) {
  return num.toString().padStart(Math.floor(Math.log10(max) + 1), '0');
}

function getDownloadSpeed(speedInKB) {
  var current_download_speed = parseInt(speedInKB) || 0;
  if (current_download_speed < 1024) {
    current_download_speed = Math.round(current_download_speed * 10) / 10;
    return { value: current_download_speed, unit: ' KB/s' };
  } else if (current_download_speed < 1024 ^ 2) {
    current_download_speed = Math.round(current_download_speed / 1024 * 10) / 10;
    return { value: current_download_speed, unit: ' MB/s' };
  } else {
    current_download_speed = Math.round(current_download_speed / (1024 ^ 2) * 10) / 10;
    return { value: current_download_speed, unit: ' GB/s' };
  }
}

// example:
//  MyData.sort(dynamicSort("name"));
//  MyData.sort(dynamicSort("-name"));
function dynamicSort(property) {
  var sortOrder = 1;

  if (property[0] === "-") {
    sortOrder = -1;
    property = property.substr(1);
  }

  return function (a, b) {
    if (sortOrder == -1) {
      return b[property].localeCompare(a[property]);
    } else {
      return a[property].localeCompare(b[property]);
    }
  }
}

function paginate(array, page_size, page_number) {
  // human-readable page numbers usually start with 1, so we reduce 1 in the first argument
  return array.slice((page_number - 1) * page_size, page_number * page_size);
}

function getPathDownloadsSetting(objectName = "") {
  var objectName = objectName != "" ? "/" + sanitize(objectName) : "";
  const download_directory = settingsCached.download.path || homedir + "/Downloads";
  return `${download_directory}${objectName}`;
}