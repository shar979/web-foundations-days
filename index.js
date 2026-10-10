let balance=300;
const fuliza_limit= 200;

const fuliza = (amount) => {
    if(balance>=fuliza_limit){
       return "You are not eligible for fuliza";
    } else {
        "You can not fuliza";
    }
}
console.log(`Your balance is ${balance}`);
console.log (`Fuliza limit is ${fuliza_limit}`);
console.log(fuliza(100));