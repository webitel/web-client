for (var i = 0; i < cdrLegs.length; i++) {
    $('.nav.nav-tabs')
        .append($('<li>', {class: cdrLegs[i].val.variables.uuid === defUuid ? 'active': ""})
            .append($('<a>', {href: '#', 'bind-id': i, text: cdrLegs[i].name})));

    if (cdrLegs[i].val.variables.uuid === defUuid) {
        $('#json-preview').JSONView(cdrLegs[i].val);
    }
}

$('#save-json').click(function() {
    var textFileAsBlob = new Blob([cdrText], {type: 'application/json'}),
        downloadLink = document.createElement("a");

    downloadLink.download = cdrLegs[0].val.variables.uuid + ".json";
    downloadLink.innerHTML = "Download File";

    if (window.webkitURL !== null) {
        downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
    }
    else {
        downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
    }
    downloadLink.click();
});

var menuItems = $('.nav.nav-tabs>li');

menuItems.click(function () {
    if (this.id === 'save-data') {
        return;
    }

    menuItems.removeClass('active');
    $(this).addClass('active');
    $('#json-preview').JSONView(cdrLegs[+$(this).children().attr('bind-id')].val);
});