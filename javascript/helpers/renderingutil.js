/*
Described in tenths, the keys are returned
*/
var g_flats = [20, 5, 25, 10, 30, 15, 35]
var g_sharps = [0, 15, -5, 10, 25, 5, 20]

export function GetKeyTenths(keys){

    if(keys == undefined || keys == 0){
        return []
    }

    if(keys < 0){
        return g_flats.slice(0, -keys)
    }else{
        return g_sharps.slice(0, keys)
    }
}