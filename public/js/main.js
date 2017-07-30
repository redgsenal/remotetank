$(function(){
	console.log('test main js');

	$('.btncntrl').click(function(){
		var ops = $(this).data('ops');
		if (ops){
			$.post( "/operate" , {'ops': ops});	
		}
		console.log('ops', ops);
	});
});