// Conditional scaling of measured serving groups. No inferred cache-to-compute law.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CapacityMath=api;})(typeof window!=='undefined'?window:globalThis,function(){
  function estimate(point,options,hardware){
    const {tokensPerDay,outputShare,cacheHit,usableCapacity,costPerGpuHour,powerKwPerGpu}=options;
    for(const n of [tokensPerDay,outputShare,cacheHit,usableCapacity,costPerGpuHour,powerKwPerGpu])if(!Number.isFinite(n))throw new Error('Inputs must be finite');
    if(tokensPerDay<0||outputShare<0||outputShare>1||cacheHit<0||cacheHit>1||usableCapacity<=0||usableCapacity>1||costPerGpuHour<0||powerKwPerGpu<0)throw new Error('Inputs outside valid range');
    const g=point.total_allocated_gpus,rackGpus=hardware.gpus_per_rack,groupsPerRack=Math.floor(rackGpus/g);
    if(!(g>0&&groupsPerRack>0&&point.input_tps>0&&point.output_tps>0))throw new Error('Invalid serving group');
    const output=tokensPerDay*outputShare,input=tokensPerDay-output,cachedInput=input*cacheHit,freshInput=input-cachedInput;
    const inputGroups=input/86400/point.input_tps/usableCapacity,outputGroups=output/86400/point.output_tps/usableCapacity;
    const groups=Math.ceil(Math.max(inputGroups,outputGroups)),racks=Math.ceil(groups/groupsPerRack),physicalGpus=racks*rackGpus;
    return {input,output,cachedInput,freshInput,inputGroups,outputGroups,limiting:inputGroups>outputGroups?'logical input':'output',groups,groupsPerRack,racks,physicalGpus,
      packedGpusPerRack:groupsPerRack*g,spareGpusPerRack:rackGpus-groupsPerRack*g,
      annualCost:physicalGpus*costPerGpuHour*8760,powerMw:physicalGpus*powerKwPerGpu/1000,
      continuousRackEquivalents:Math.max(inputGroups,outputGroups)*g/rackGpus};
  }
  return {estimate};
});
