const receiveKey = 'C9h9UPcqMGUbrc3X';
const postKey = 'Vc4hdHaPxfYXUBwk';
const siteKey = 'W5sh5ivEkeyEAxkU';

const ABC = "-1234567890СДЧЖИЭЫЬВТЕЁЪЦКЩФЗАГЯЛЙОШУБПМРХНЮСДЧЖИЭЫЬВТЕЁЪЦКЩФЗАГЯЛЙОШУБПМРХНЮ";
const smallABC = "-1234567890сдчжиэыьвтеёъцкщфзагялйошубпмрхнюсдчжиэыьвтеёъцкщфзагялйошубпмрню";

module.exports = {
    post: function(){
        return postKey
    },
    receive: function(){
        return receiveKey
    },
    site: function(){
        return siteKey
    },
    encrypt: function(input){
        var tempString = input.replace(/ /g,'-').toUpperCase();
        if (input == '') {return '';}
        var now = new Date();
        var today = now.getDate();
        var output = '';
        for (i = 0; i < tempString.length; i ++){
            let index = ABC.indexOf(tempString.charAt(i));
            console.log(index)
            if (index != -1){
                output += ABC.charAt(index + today);
                console.log(ABC.charAt(index + today))
            } else {
                output += tempString.charAt(i);
                console.log(ABC.charAt(index))
            }
        }
        return output
    }
};