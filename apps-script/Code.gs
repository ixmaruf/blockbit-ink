/**
 * Dudes Craft Genesis Whitelist & Allocation Engine API
 * Version: 17.0 (Snapshot Audited • Dual Tier GDT + FCFS • Submissions Closed)
 */

const SPREADSHEET_ID = '1XMew79sWhhgRVoJitYh14MvRxI_V9_AL2pCfjjcNS-s';
const GDT_SHEET = 'GDT';
const FCFS_SHEET = 'FCFS';
const SETTINGS_SHEET = 'Settings';

/** 475 Official GDT Guaranteed Allocation Wallets */
const OFFICIAL_GDT_WALLETS = ["0x69118ee16731298ea569e89a2a235dfab87caaca", "0xdff1e5631fe69b5b08c95a71743aad8372c93c98", "0x2AAA695F47650D68043c538249783229E4Ca109D", "0x84309853ac136497b6DB580B6B1B587dbc182aBd", "0x0B0954DD0973A526B8AF80Dd80535CC120CD2671", "0x2626B0b64acCAAB418bAdBAA6e20623F52DC144f", "0x51d10EcF4B296ecD45C2E958469064cb5f1A76ca", "0xA70939315Df50ea29D5165f1B94c99af7cfaf42e", "0x928A68da465F055931c0Ce9deCc2c59181cfAda7", "0x6820e722B96a13B65F74BD02849E813a98359610", "0x9BfCB1Fca8ce6B9E031cccF09540B1762cb5DA0A", "0x6aB3191bCa0FE0805E1594A7C576da5D37626bB7", "0x2c064d7178DEbea4c19D02284FccfcA407E08138", "0xb2d33EC87B952bA7fb5f53a37C545E6c3490bd4A", "0x195D11EdcB7988F60e30de801B1A1f48c9fCB560", "0x1C49eC34eB09e4DCAB25A49d684ede4C4A5C69A3", "0x90537965e815e056ae0058d9944f28292e146a90", "0x57215f70a83ed8f97702ee85b7e53a0df82c53fc", "0x430Db6f03A9Dc4f8a4E8b271558E863b87911e05", "0x091d9f46032ed8df019bd1f06c1466116b35a167", "0xdfCf870A97A4FB01f628Aa3d4Fe6546D67E769eF", "0x9c49ba7b34402a09790d660ca8c3c0a50ab3283d", "0x0c5c2e906b997e448854034f988af760b0f82339", "0x470f83735ffd4a81f0a2381d4aac53b4b2919806", "0x43b2da3881f22a87cf0bf66483cc59b97a4d9af8", "0xc20ab8e40da5c12893bf87c6fed27debc4f19532", "0xf06a18dca721dfe561d08e2dfe6906ae35eef805", "0xe303ddcaafee3cf0e46aa2974d563bba0250e63e", "0x0B576A03E4CEf2E96D64b874dE667E4Ce1E8E148", "0x466E7b0eBA89a6EE523A209e4Ff7558F40e3735c", "0x99DC5C435ae3E653929cAfc2AbCaE06Df2918fad", "0x03953890ad8e31ad157cb7e565e49f34cebdb107", "0x331f69eAc16c2D1317Bbaa5174664A75D2Ec3672", "0x83265381b1e1ea750a80bc0ae9ddcea0367ff540", "0xc3bc2920ddcc33abfd8bfb12ff09b8260b4dfe40", "0x5aa299665bd2d67cdd7c86a432e0ea0ea26f623d", "0x6ba343caaa9ebfa4ce630a4c48df958c1a8c893d", "0xf0b7c182b57b56e97b75f5d34e918897a211f5c8", "0x13cf1d714d59cb1e4fa3bf4a825c56f6458f2435", "0x74070C8666D7D54130758f4596C32f3A33ea1561", "0x5104218dae7790409dc0b0baa33e91fd110e896d", "0x516fc7DD4544be7AB67025780812c49C58161C73", "0x47f053bb0145b27b8d2f41984517ae81144e89a0", "0xa831c8742e8536b7927c70bab668813cc73cbc14", "0x4cc8f688eeffe8afad4831280a71470ba02ed8f1", "0xcd4052e67ac01de9dc577ffc555550599150f3dc", "0x1a0e2d49e253efe86620007fc9fba9e0e959ffed", "0xe3588FE1e0025853c5735082DA2ff3e0b1aA1348", "0x0db15bbedebacb74598557da3dd80faa802820c6", "0x7fec9c37b14c8103329abd1d98561fce751d5c32", "0xe1965cb9cfaf1dfb092442019828657235f4d445", "0x05ff86fd4d986d80bae63cd8226962cc84456df5", "0x6966e431B7E31493b5a46F7126ee0b94794194E9", "0x7a99601d4157d46e3ba51ae07daa62e8ba733a88", "0x8cf0a4a6427741d55be26c780ffb0dee60d41b9c", "0x0e89Bf5c8750b9cF127Cef5a2460A8953d3E4AC8", "0x339c8d16a52b8f037c4496827ac28f374bbbb412", "0x7a177f85c147de103c1bd1af8b3e1346a588c835", "0x3cAb8C72Be9477A4b4153a75B6baA6559022DCE6", "0xfb9654520cba95f74abb14747fabec9b0d742559", "0x10B7deCd37Df7D7833B93a2a9F23Bd839d631587", "0xc01d5b2bc697bfdb76e43501f7795bedf78b1d74", "0x71fed55803cea4928d047983cd911cC719CFC9b2", "0xc9c1ee5c76d4b783f4527c35017b33161656b069", "0xdb04370b81e86ef30e365ef9af4a6260a3b394fa", "0x5ebddcf87570a514b3402d256feb332d7334a396", "0xb36c0BE89200a9bd3dc975004aFdA448a6d90032", "0x694d682fD571efB8695d2bF615406AB6B5c6AaFc", "0x27dE31442D11A59748BC4673e04Fe636377cBe85", "0x1fa8b997685536696b6bd755d7f7573fe0570522", "0x1a75104583bb0991cf3198d0d4fdeed64f15527c", "0x7fd63ea6ecec9de0068070e3a54c2f1d32e49146", "0x7d4376419d8f0c5365d62149f0c9e507bdf18e3b", "0xd5c0c557760c1048f83eec05d60a10f80543453a", "0xD964822208D4FEA003d01DFC08a49a54dfd6A6C1", "0x9baecea53e947afb281d7e64d0fd9eecf12562f8", "0x8958dd974216518af82828d6e1d33504d2b44e68", "0x878c3f66c6e92cfda0cdbf2b3b701c3cfac5905a", "0x15bac7cAeD999F7E4C34a257Ec2f9932a2823A91", "0xff81572186473fa55d84948d21af3d79fe77f592", "0x4160e0c860b9c6c46525cb32995faace1f292e59", "0x4b23d30bbe223c9bd4bfe5f51edca36cc2eccd02", "0x399d86e13dab36cea63568ff88dc7bed64705200", "0x5d4a213bc3a259fca96aaab57f9aa2f1809161ca", "0x3fd3059011803e195892c1ce33882588ff8e7761", "0x731836b9862cc89ebdbdf90ca9fe99a560177284", "0xc82aff5cbdd794a1b5e3fb986c5aca79d201b97f", "0x35e133a1671c95ff4a8e6864119fd74c581010be", "0xfD27174986ECF37D85300b53CCD2C564c4a0524a", "0x967cD913F7C33C356fa9ee8d89e5459F376Ff1C0", "0xcc2bb80cCdA2B75Ef747bc8b5d89593458c9B57E", "0x647D9A165432C09F2608Dc4687B2EF276BA7598d", "0x6c0578173dfE9C399A1aE93647e8Cac7DbB3022f", "0x8765BBbBC020A058030c041CB4CeCE169E41E6fa", "0x37887749DEC8bdE618023A0D6B2e758Ce554632a", "0xc76af2ae85524ae8503Eaa0a138Eb636eAF7CAf7", "0xA865c8cdfcD73B5c23371988c81DaF7F364B395e", "0x2963E753A80cDd6AAb97ac55f8ab927626640D4d", "0x2C2575F14AFA0E5D8317f2163325155aF66A462d", "0xb6418C1ba3c59657f9CA5c3f9322Bcc394c0E993", "0xf8105eF3EA823fC6816e1AE1dB53B1094C837841", "0x3aB0a4156884a82b40f63083bd41eE3D8F339582", "0x6A23052e6C71A837E8c1C1c40A4dA93E5Dc9e829", "0xda79bfb4a0dd01884d00f64b1c6efb1ade3957bb", "0xa02632Ff0B80C02497cF2eB28524E0e26d03a46c", "0x2C4109E0F6aA46986c66DDCd66c6c7c80CEbB4d7", "0x3DD24993B591aCf91E089D8f4e620Eb96f479D6a", "0x92CF1AEC23A1faF66b294f68194Dd442Cf05764A", "0x5D60886a6018088DbE8ff85E6B438ae409C7D193", "0xa2574B1DEBa764b2A9c0a73eC37A0dD1b8cC4e61", "0xd1B8446dBe41BDb9056BDE875Ab1A89E510C0129", "0x455c54245BFE36D811b3955eECF3D050623a8bbe", "0x1640f082c382f5dc4af0a89dfdb1b885cd295f3f", "0x30de9e1931c43bfdaeb66a23c6ae2d9550ff515b", "0x487DF97c9625E365fEC410f4247AB93F7C269C17", "0x28fb3752efb207e54884e567f2cf07c1d9862328", "0x85B1B7d7472EB9d05cD9835db94BeFbd34F26a13", "0x424218334903458E0862f48FED6C56aE795C2a82", "0xa88D90ac6F1929F39caFaf7db4E2b99e9A229dd8", "0x5074BC86968b6f3134A5F759120F3C9558FA0D96", "0x47598d202d5319f9e40bb7bf0ac78ce0578a86a3", "0xE18F46b38Ad88Db666080B11BCe8e10bf0146A06", "0x30e6A444612979d8a0698150c6223662a17d22E7", "0x577b79A6193bCB200ad6D78f8f0B3A94907300d9", "0x5d38CA53b5b7cdF7c815285c1927604Bf0E4532b", "0x8b402a06C4cd20f0e1fA389e389DE60bEa9387a9", "0x855e86fd703F169e559Cdfa5668e769563A2B3aa", "0xa16eeC18190D8Cb573262990646B337f78Fb519b", "0xa7950f0B7c8F9c769F90b825Bf3147038234749A", "0xf2165f543cB61978F4594661939eaD25cc7484C7", "0xD3a79AeEB57450fb918Bfbc24A8Cdf6E474EB087", "0x25af77556e1AfB3D10390c8560732Ea0b6d1040D", "0xa5bba8278b8fa9fd4689cb0676d98a78f4232187", "0x5c2B49684ff4C049650C0e0e93dd8a0d16097e0D", "0x41045b4c5991967A91aB596B02eA91BcdC7E6A59", "0xad0d7b00ffa6280e800c14f7aa7b6ccdae0abaad", "0x62D4C5f4E890caB3bc6196f5485D0F76bd8f11b4", "0xf9358e13621f813b4ce32f1d93cf1373f26a7f57", "0x34a249F74728Ad2B11CeB9AaEC47665482CCdB1C", "0x12064ba6b6f57b71f0776eabf98d45a9db34d649", "0x889BA5953E4E1fe4bE1602C6d3dBb0621aD5Ca98", "0xc9949510a6a617a4db3626735a1938bd1d634ecf", "0xE32d27F66ef861ca79F408bEDfc82cA7bcb3BAD5", "0x5152FC86b451C161e104144A515778FcCBa77292", "0xa0272f46Cc11d7436Fd63D57e1F376ec596fE3Da", "0xF2711e928f3D116091bF82E9770ffe98C21BD947", "0x15Cee9f2b2cf947FD9dA695B16193287F7526455", "0x4dfaecef25060a1d421726c0be5cffd96da4cbf2", "0xa2df5645d1fd19b25e47f1f77eabe6e977b661a1", "0x55De3AC3d94B424fce60B30289E8f9Fe2252120a", "0xf69756ec7f8f080d4db55fa1233416b8a93718c3", "0xA9FC1706BB3cAdfC277161F8afEb9eb65ECE8B7B", "0x8eb479cca3c1202db1a69ccd8cdbd72b26a7890a", "0x1b91A5AA7Cb1bfd3dcc5c3847eCC8FCdC5D33a30", "0x4bFA3E5b1119BE4633Dcbbb68fafa430Eec72787", "0x96fb2712F0d69C13263D63438a60A9128eDeeb1E", "0x7a631811c9582cb930094e2ba47c4dbf51bfa150", "0xe3869c7ea98aEA27ff0A077964e27Bbe82d1f067", "0xC9955f3a715493943e71dcCF62842b8F57543d13", "0xf89bEB6D0421D5de23444d1D5Aee776dD4D60D22", "0x374B61F4Bc33dB85aF6e98E21E64bd461076a98d", "0x50BBA7896a473884DF1E6c8FDd815cEaC0eff80b", "0xb84f1ad0d372a5cfaf007063b65b4dd5b06d7414", "0x9Ed338a6fDdc110fC145a44655eE9215bb7DFF00", "0x230a2849b5ca854abcc6d7dde5657ba931b3e020", "0x6829beb7456c50435e30a2ba07ea4a79a07c51c9", "0x3f4C3bf9e77543b4B971911Fb466328cDf967485", "0xa1854e277fce047fae76963ae1d2efbad217f78a", "0x771b5c6538db9e49f007df0f809965aaa1451f0c", "0x3c20ece9bc16a1f1da6676937dc1c7514cb03d5e", "0xC99029cB1949F8273489aA1CFCB9Df8eaD016CAC", "0x18b91f2e9fc2480ac6540211287048ae90fe5340", "0x23847e2b0e513e053345542d9ff0e1f8fb71450b", "0x3Dd5d8EAAA8Bc4C0A7c4670b7dcb38F04dD195fF", "0x82978304d1b38C34489B86b649A65b978e74bc51", "0xFc5317EF46A6580c716273CF9EF93abBf452A390", "0x1ddaf77460B60Bd4939DEb9C11F2170b7CCAD523", "0xC1FCCC54b52E11C5869195cceCbA2839b4c78397", "0x048F557B91814464f87F09Ce8b310a7b4f5e705B", "0x7Ec6d18a0445960DbDfEbB3B1CC33E8E60d25a50", "0x77a09CCd4581A9fe0699A6EdbACC23F0c6bF4A09", "0xc6804E92ca8D57d684CeB9C4D19d5De096A45bff", "0xDA2649EeD2d7735Ca64F6bA914B9908Bfa382AF2", "0x705C4EE07A2549efd804E00F205c1B4Ea157bB8b", "0x1DF1b2854d52374E0F97d5d53183300e66E47AbE", "0x84bF2cCa01399959686d5515244ea0264ca8cF4d", "0x408a5800981f8D23Fb6CDc104ca39aB96a69eDE7", "0xe3710bdA87dDD8DEb05826F746EEEDEbD729675b", "0x9B760bB3e30E8e0aAeD529311D1942dDEA5ED11b", "0x31e4612856B67Cb782B62bEDec9AE3039234Aea1", "0x140574a00a411C4515e0bc1363524E0a21e1D432", "0x4c2b3116368a400167817307e6f1e3394a55a777", "0x7C6d16CD52abd69bc454A28a6982117D2Bd92EA2", "0x9e172c1edC2d54ddD5f6a81BA8F5A33e33A5bbe8", "0x1fEc1e7e84A4f850a7a7Ce1E3D02b6bBDE7DAB3f", "0xE1EE0E8939D18e44bBB95Bc28092fD0CC71fDC40", "0x3A7c45DD7501aC54209cD7CDab03bb66349D6819", "0xBD39ceBB4A7a19260c8b6794fdE1e04613680846", "0xFea26693393F92d9B8d6f02b3dDd988c2308bf1C", "0x6AbF943abA156e4b9A94d4492C2085DcA90BaA86", "0xf123a0abd388be01bc623f7ffc109c7f1b24409d", "0x28ab46b2c638e1885695c9c890b1093c96409383", "0x369cc20b4e4fa2fb81747f4e56561617308a27b1", "0xD2DB9c0a2BcB090E7CFE51455bDb51Dc804365e6", "0x1495fa72b93f57cc5a09db6022df7993f89db9a1", "0x4e55a9397ace81c34c51ee17be23eedb64225e71", "0x296aa121209238ebca58867a5e61a33bb512100f", "0x463cA2c50a235E5d598a51CF7b9B33B45C3F26a3", "0xcfe4eE460E80B3863C4D10830D50285Aa9050275", "0xc60370B6d5aa68Dedc20aaDD3c1610FbCe4C44EE", "0x8f99f7c6f9268060b0a59f890cc84328ccfc8a75", "0x4D7FA80d852781Cf5561D89906A8301A83E49145", "0x116493cc8ef5fd5934186eE9C71Ac0303A6e699A", "0x38777f2e23915AA41b56Fc70664CDD1aC84BD8bc", "0x252ab20025505120302D38905057f2DE030938f7", "0x229459988bddeBfdAb13f1AA8909f9438cf205B4", "0x76685860d0431d9e7d48a48361044f0701AFF555", "0x8DA949296EDdA669dae40BE005512A6b5298135f", "0xfb3A97D2EEC1dA879030b5e29FB6830F13a28a15", "0xE5181Cb3781E3d332Ac55595326C3c73825e5496", "0x649B41E10F2c603dE2919F2d488db48A2f45CcEb", "0x4D54A420234D9cD7335BCddDa05A270F93476416", "0x819C7c04fBC6E242BdE7c129BE03982D800a9dEe", "0x182A90407DD5F6A9855429ebcF4158eFdF035309", "0xc1A2315bB00f9e185cBb90920D47b6513245ef46", "0x15f9d6dd65B316d5CA63e9a64a4f0506FfE33657", "0xe6efc9f2c0e55e4fe1d69e7e54b4f160c6a45f4f", "0xA0D6f4Ba5D026404E5896BaAf3a83c0308525DBf", "0x46514F2E593338ACD8057fEe9a76CDb48BD59942", "0xe67c04d123ea638bbbbae83917f8385651b5687c", "0xea9bd1c11acb3105dfae983d13c7f4102bbdf2de", "0x57bf55f909dbd2190f8be12690a4e5f3f5d8b48b", "0x149cdc9bfc7dea8cd3c6372b928b933d81dd4ca5", "0x4296023e11e54D53DE047DE7867C0A0fc3e3f5B0", "0x4c8ffc4eceb335a71fd0799aaf8563109aa90fdd", "0xec92bc882afb6132c00d7f89bcca060777fc2fbd", "0xDB02041FB019f05B28229013931Dc23251F5A42D", "0xe335dfdbe95e387b917ebeaa1ea160bee23a3daf", "0x41f866c2ddeb010eb67ffa08df3bdf7e49c77411", "0x01194ce4e75e552fdce829a48b0bc7d4c3cd8088", "0xc11965ac31aecd013739df31ae9357958479d7fc", "0xfd438f45cf93aa4b4726a288d946fa4f3c66ce43", "0xCfC020061B0E861d627c6626421322A049B7ED39", "0x9DB332AAb9f5266843eb406f5bD7892F70C2Dc73", "0x31E327dFb46892ABFD5968f5a01F144D956Bf5Ea", "0x15B09dBc83FEE60CD5167300E64fcf5FFaa37C85", "0x29C0b5AdE2cEda48F789EF3EBb3106A788270e50", "0xc9b59fe9a32348acd21fedc0672da75eb778735e", "0x56a5Ac1A9ae09eA9b2Cd4C38B7d305aE482Cd403", "0xc5e27bb6e97d75df63800d4d50dfd761dc4e8b04", "0x4F0894E6202839A19360A3B118728B639f741C7C", "0x4a0e7b28776930f00b2d6d64c7744b9aaa8fa7ed", "0xe905db465a7e105fdd6782a0729b0611ce9853a9", "0xdc26742ee18142e26c781a3f54bba36561b86e47", "0x44454719a01a44474146aec17a6a85d316582aad", "0x391a60ea20006b6c41cab0d0e0b2c26ba9a6e8b7", "0xf1341c21f2e5c6b773fa407be2101b515c18be19", "0x350dba8e828daeb4195ef329f65b354683aade34", "0x95781ddd330702dd02d5672cc2d0549a4ce3ada2", "0xfe41d76bbd2f7a2305e24336f1b35381d42fb513", "0xcc7f944977507756bab74b12ce1b65d166464acf", "0x55f59dbbc948342ad0de81e7736a27e35d9f6eeb", "0xa1f19a610c8f28c19b4a7633d8016b56c2e58b49", "0x73438fdf96acac0e12bcc425d5409a10fb54b7e4", "0x16e97cd5c8d4bd9a089059aefdd99e40b9a171b0", "0xcE2f6E6a221f44a1C42636769Cde1146dE50D64B", "0x69b9Da0a712e5b07Fe871C9855B26dA9F87b746d", "0x722E1e2AB81Df6eaAb0aecE591FF0A9211Fb03a9", "0x71d0dbfe3f583e355555ac73a55e11934b3ba1d0", "0xcb11Cc3e152A720C6a7E8A1795690b052640374A", "0x913b81085532fb9be34a50705344a5a677605b85", "0xe8d18f4bfcf8b2d93024ad7d0b9bb07654b73565", "0x11ae93794f03dffaa50f3f6b359921641223d8a2", "0x68c5ee873419b1e6095224653fdce7bd5110c5d7", "0x97813794be7a6b651349726d687d64af9ea04ca1", "0xf8ce0101ec36a14d7d92c371b3f7484014b500ab", "0x618b427fa7f20eEf3e553eA0Add5b7874BfB7549", "0xe84831520a99dc9eea99ad9d3da2993962c88106", "0xcC1884880e465FCe7B7Ad1ACD252dF407b4e8588", "0x3cFcc71B96C85b8D70828a36F8926A4489Fcf2BC", "0xdfb085b7d3255530490460e435368587A4d0c42c", "0xcE379E44FeD631De1d973204441005B102085050", "0xb87F07B998Fee221f119635542939BFE171F7D0c", "0x0D4c7FF8b24B05Bb88C0598c8d4c940A3afe10eF", "0xfAa68Fe7e7B36E15BB6DB6258bc204A0300a1eE8", "0xF6d9949f8d50d5cD75bF2B3895B16ba1eF1f8eb5", "0x91269F5aFf3451F314b8FEDEd1e0D54857bB2517", "0x31e3BD7F4c8AF34BE1e77094EFEA34202c2eB4f4", "0xC844691A189c5c7C005BdCCE85bCCea42DF0EAaD", "0xc6d029f7adcD215c724A7BFC42E9435Dd7bEC92E", "0x1dD6E3A04f407FC0c9CDE35e3508bA5592a4aff8", "0x58907Ef42A93DE23E53E730c4Ff8350142975E54", "0x3ee3c67b657A0c934BB993d0Cf4f4cdE54381b03", "0xff007aabca487a273e6c8107f82988ac7fc653f0", "0x5b32971ee68b1ed6d11476760106f29d81f77f6e", "0x377E2d1c36399b98B436722Cb7325ce7E4408297", "0x18e755b5D51EF44068bee337ee0BedCe71D7B7D2", "0x26fceCC081552A67CB6EA0b79731d911F18e4aB2", "0xfbc7982d9521ea6b130a34963578ee7ca158f5e1", "0xb7F722320BE1122c5a1EC3197A7C65edc825b113", "0x743a893B6D64C57c371b1FF79BecA08b0B176e8B", "0x52225708b0C96D0a40D32Ce56B01388ec2f6e27f", "0x909c4397f83ff6d19e5c0f7947388a6b32702156", "0x275d586Ea14240C84F8916467F07F3AA0FfEB08f", "0xb0908321ab724d950b417395ad084456f6f67e97", "0x77354a4CC26B41e1C3609E680BDccE48b89F4f16", "0x8FAEEf2A97EcC4Ae533D5c4ee65f87f02aA1ac0C", "0x8683797F90B4c42f1c7AB29623101506aECec487", "0xdbaf0e5854a0d70bb7d3cd2f31fe04179f078968", "0x36883C7EDaEe76572AC7E9aDe25adf9BC728b376", "0xBDCc582078e6bE90Aa52DDf06653197ceEc4e75C", "0xD8c4CC3Eea7E34182268Ad6b432E332795851de2", "0x1ebf9bb2d611dd4e8ed42a4c3face536c4fb2c5d", "0xF681C0587A92782d06DFd672b1C1A1378147783A", "0xB8186Ca1C62724c8179AadF03D50428939F8318E", "0x93c28C8246158a6d8A6091DD7dE3103A35665913", "0xF85424dB010F56fA308a779C5b21e82deEDE4A34", "0x98037e1f6B04e9CFa7F51bF29a2f1D128F349FC9", "0x7258Dd46f3b35878299D31d474b8A4E23d329C06", "0x8c14095ac209c68b216df8f2e3c13b8bc19fdb7e", "0x50D649862EDE384fb6cF8044DD23Fd103Ac4277B", "0xa85eb32739676b63d03240610127ad547c113493", "0x81BBaFAF3275305084B1d86c4E47323e8444c6ff", "0xB636CDDEbFa5e36d5E8408745FdB39C7aA18c3d9", "0xc2287a5166c4be46ecda69b9bccf675c8cb794d6", "0x6f722ace9e3a4f01060bcca542e73b4c3a081dc7", "0xdd7fd498701cf5e4acbd5e1fd9f3da0585838268", "0x4e3b795bd32a8fd443dfd54c4add28ab07d96520", "0x0e7783627E9011e9b22C8c3a7912428c8f1dBB5E", "0xA24783566C0ED70705Ca4e0BBA4E629cD04bf370", "0x80D787cB49F3923CBF441400E2188A3ceDb9Bb92", "0xB380bF5Eb9fFDA33BbbA7d86a906ca875397b4Ef", "0x821FD3409e4Fa4A6fcC7733b42C1795c005A4F31", "0x00283c38e5C08550252BAf711A20f30BCDf6aCF6", "0x4F91E3feC5c849ccb99351c97329BeADB4E3C004", "0x1dE109F633dAfc0267d6fd178b6f35d666d5Fb57", "0x71725c908ffdb6f4c89ac418d39404e574d24945", "0xdc2eebf8012aadce36e1ae4e614adc027918456d", "0x93c4e679a27f24928ba5083cabdb8587e30d1be7", "0xDFc206CFbcE1Dcb15Bd53D06f261C8aafa99eD3E", "0xa3cE9b4EA5E8e3d3BBfc6E5649D3b8Da1f812542", "0x8db662ab4fd5290d3b728e316c1e09f50758666b", "0xaf50c021736bca1251129c63f055377d04b9682d", "0xA370eD3068c73767D4e6c4039721455F12d4fFE8", "0xf10c8f779284ab96190903905072e15c0b5fa6c3", "0x15109291D0Db804c21f64F44A489bD5514689C66", "0x678bc4330b85140398688328d3215f990c39505a", "0x6e03fea11e409a73eca838bbc36b8578dda48975", "0x39931b51a2953100a5f2bde398a3831a09e1b9cf", "0xc64f49bd0563c02f24fe69138d45b9d31b384554", "0xe46606b7e8f27940b4c025bd53edb375139b5f85", "0x724346b1be83c0e435EF28a357ABadabFd2323BA", "0x6Fe6D23f8b2CD6D344Ab643425fAF768EC0f79A4", "0xcec267ef89fe084a4f7ccec115bd69399455bfd9", "0xb6693a8ae71eab04a0e988d2abd1aff8b1840cf4", "0x2f0402513d7e3fe8a49acb3a07daf41ccc68b97f", "0xC8633c76448055267A61Ddc98CcDD997bba78542", "0xa9ad3d919792408b56984a46b7fa5237e976280b", "0x6b13185848c3a6798985ea69a864b3f3fd980f2e", "0x5D04Bc16c226974Bb71b92426Ea839Ca8DDA1269", "0x1f80802170d6053E258976DA3C061c42b44761fa", "0xe78f1cc9c6fd70d8ec3fbca052a50bc252a2b1ee", "0xD699593E1C4505A358a3579ee70c1cF7e957fcf0", "0xA92831E5C7EE4E266E9c491f2aD32a1FEeDA5876", "0xc88fb157fbb143e213ce22aff4ec598edfb47c29", "0xc68762beafd1ddfb49f6aafe1d806811414155f5", "0xA34F6916118AbD4AEcBB0A15F5EC85d76440778C", "0x02c479DdF4aF275f59d03d8f0b7e0954daDD0A71", "0x229b699a78d486Cab78165780cDa8ff9fD893611", "0xf21fc9ffec190a8697fcb06da8d1599853b6d3d0", "0xf461158d89A058a488De86A295DE2FB51e594Fbe", "0xE1Feb82ED0425e0d01BFfb487eE88687538e9266", "0x3669d154C7b5BE8963730B1827B226e5e051B2ad", "0x6a63511C3676b9ac5537062fD0EDFAa6D9abB9D5", "0xe88FAd6AFC2A4ec5AD45299073F6aD36499B588D", "0x444A431172aaC6D64C28BC05166ceE184DE962D7", "0xF458228B4C1DE61C3Bb6F52474efd0525875dC0C", "0x3FCd7b9ee8f7E3577882939321e062c52533f216", "0x1540740296f18A879e2076dfC39B4d121E939d5D", "0x813A391942Bcb8480bc093a6631d12C0F6541B6b", "0x5831ab1209c255d4f4915be596bc8878e83cb534", "0x85f7099C8EEe2Ebe8339ED9Ba126Da4d3b36171A", "0xee508d1320BA6bB425b733F79Dd32A91Be50edEE", "0x3Ad3Eb5076d732DBA1fBa5A915A8848d0DE8CCA4", "0xf676FDE2386DeD3a476a23B1d6950baFDD7254Ff", "0xfF5a114B3E315a5A28438f330b9433C217BC5e0A", "0x48FbF575111f2350cEE0E7C28903e5964Ee64ce1", "0xB0aA62e5fE1b9E996420f1c8d76c51828CbBeBD5", "0x9b6c5589bed6ac341b1648d375cf8c628a464ed1", "0xd867f024348958afa4394e4faac623aac7a978d5", "0xa77878fef45cc4f0d8cef9fa0a44ca321f6f4034", "0x34a8188De2320C51D327CA72dAf66E04cAbdf1b9", "0x28dB2d73080f26a6cf662c330E7d7864376c402D", "0x641253B6d82573a900c3C231BFea11BFA73BcA7d", "0x32b683ab7fd173f698142702aa462e8ad03a5284", "0x2EA776C997012354e4c5Cc7909Af899384C6310c", "0xea7c2848d51A03CEF29a68E275D86535E6844A07", "0x65ec61892BFA67979369A860D6359a98362dC70c", "0xc286b9A3A8Cbf180d32B80E9E791c5C09731570F", "0xF8207Cf2d7bcd7217Bd001e828f079Adf2EC1026", "0xea7f07b4e5f4877a589b6cb8bea6dc3643f50219", "0x1b81958e0010082B655f386453f0Fab1bC2ea569", "0x80b4a24abfd66b5488fc7206d3cb0285a45080a4", "0x97db8b03543467d2a44d827158d5d50076a1B728", "0xdaa03bfec631667b12824b532f9905f7bcb90c54", "0x4d68e735d774bc5d655e217aac252607b8cd8e0f", "0x7e532d0d4a6f214fd5179f32126ab299f904e761", "0x87d37733b96a587650ddc0f9491ad38fb4bded81", "0x43c48101330286ad7a578e8d8c7250c5cbcbd783", "0x8f716b4064685f156748901478282b9b8df87fd5", "0x12A6a66Fe545EF5fF011e4Db623f5f8d32d4E351", "0x4fec8b5c603f1b4211d23503ac893b7531c3d2fb", "0x5757f0e8273a8a6684e71840f1df12936a9959e5", "0x8ca5ed93609583948fbcb45820fe7ea38494c717", "0x7c40d844a466cfaf53f7572eef1ab8311e6003cb", "0x82bAA1A2Be46DaCdBd6b68Eaa16baD707e0877Ed", "0x3dfd56c7b6d0f6263ebf5b0170c0b17b972dc422", "0x453bcdd7b55696792d945e7ef1d817ed761b8af5", "0xE5Acb0931AA3F755CAb98c2a1F3081C401282843", "0xd7E3C215acCaa27C03245b4577556f20556fFA15", "0x86ff1Db409dED19F1FABbA74d95946527B909BbD", "0xa931D1Fd0F87191e3CD71e68c6A6F39e588CB4FE", "0xFC6e1Ac74f8D655B3E1523EA49978600f3CeD992", "0xc7082f2659C52A3c3cE66Baec1E126CC09066d6C", "0xfe6a3d2cb9931f4e028bf22391e20b5e58424b2e", "0xf2a978d103d43cee6dbadb2e6178a43517328253", "0x6C7f967650F37d461f666d3C25dBe267dfDd5b7d", "0xa5C77F7b1856f26d288d2B528698581da2732116", "0x685529dF9A526FbA17Cc71DfC5e974C720D2872b", "0x4e4b49b4C94D49a87EEEe4A6Fd0803C27F18Bce5", "0x8f6a822C2E435Bed1317570aC4FC98674Ab17e94", "0x10475FB6CC4881BaE0Bfa8E04E6c591ed922B51A", "0x795E3DFDF7bD0E5e6c616Bf6bdFe56DB76112DD1", "0xc1C97e496A5B6154C4d13cfE21bA6Cf6B5C2dBb9", "0xA70590d97183795FeAfDC0AD5b888Ec7B55ef930", "0x6e7EC52e9499ca32D3b35EecdE4B4d845b7b2F10", "0x28a7fbBcfe219DdB0f92810D4829AAa8F7D7DD3f", "0xd151419ce76F16B2cefC606F3D6D9B14CfA84220", "0xaa24b55ffcb9f80b6c61e5f4953d81be965dec3d", "0x33967c3339BedFD76Ae492D9dD6be180DCAE18fb", "0x0eDbC7648F22BB1218C640b22788E45a667aE644", "0x917F9607Ab8d504286c885562d237a340cbc6879", "0x6a80e4a7311be59278312d6adfe53fef4bbd9a20", "0x86938a940A401c8F896A0f8e6777B5FA3081828c", "0xFb0be233b172164861905a9ad8A36daf2F8DFBe9", "0x8cdd3cbb64096a4991770b5ed70b90c7a050f57f", "0x56e78b1793338877d7ee0b5679d2db9cbdd8e130", "0xbc3179bcd419f2451a298871939f71f1537dc536", "0x0a32175a918ac70277eaa47e53ae412b421c988a", "0xd20ae23200dc81254d074320d7b28df5824a7e10", "0xb2732bc83797a44d7368b04b95879f582723346f", "0x0dc71b4a1e0d9db08b79e00a2d6778515bb9a556", "0xafe1466bf3895052e2641beb2a12d08d7de4506d", "0x7865fa0dd68badf5265f18a6f50e2f343e391201", "0x2cc70a8501b4038aa9bc7fbefbd63a1fc21f202d", "0x745d22e6da32e0ba5c30d5c7bcc341bf2825e172", "0xe5f696424f3a42e4a7bd9736dfd7502be63924c0", "0x2ee67be3eac8bb95a8afa468432769150d5f5ae6", "0xd59d325b06b9625ae81001352df00ae2ffb3d7c8", "0x532603cb9376b607f1a9c60e085c891c6ac25dbd", "0x91d2ee4d8dc1e06468e23ca250b585bc31822d75", "0x2fc807941ea4bf38618a8011480d2e5ff26cb426", "0x3e2fe7fa72bf703268627d8645172d31481b5e51", "0x2e49fdc107befe0715841d681912080493651b6e", "0xecfda643db9df505363ba612b63509cac73fdcdd", "0x0284f8c9b857213e893c0229cc061e9d5a26e1ef", "0x7ff1ebcb792032ad29970811d9e6bdb52df6fb7f", "0xbd21ec82b16b80b5b6a52ff705fe6bc586d1f1ce", "0xed2f400aecec4d5a98f9dc9056935fd844cba17e", "0x5da4c5e3ecff4e9952507b7459d165a5f2875b85", "0x51e43478ae0edcced92c057bdcaf6eca8ea7e059", "0xe34d9bc3784eafcb2132f7d2ac4f63cf3d49a6f5", "0xd7bf99a4e574fd3e30f5d808a2ec9ef9486e0e32", "0xf808433884e7a59886036c4825230c96b1c0ceac", "0x6e3cd6b1d5311afeb1357d69feecfd6f0ce54e18"];

function getSpreadsheet_() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (_) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

function isValidEvmAddress(addr) {
  return typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function hex4_() {
  return Math.floor(Math.random() * 0x10000).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * doGet — Allocation Checker, Settings & Health Check.
 */
function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};

  // 1. Health Ping
  if (params.action === 'ping') {
    return ContentService.createTextOutput('PONG').setMimeType(ContentService.MimeType.TEXT);
  }

  // 2. Settings (Reporting Whitelist Closed)
  if (params.action === 'settings') {
    return jsonResponse_({
      ok: true,
      settings: {
        whitelistOpen: 'Off',
        status: 'AUDIT_COMPLETE',
        timerStart: '2026-08-29 11:00',
        timerDuration: '168'
      }
    });
  }

  // 3. Official Allocation Checker
  if (params.action === 'check_allocation') {
    const wallet = String(params.wallet || '').trim().toLowerCase();
    if (!isValidEvmAddress(wallet)) {
      return jsonResponse_({ ok: false, error: 'Please enter a valid 42-character EVM wallet address (0x...).' });
    }
    return jsonResponse_(checkAllocation_(wallet));
  }

  // 4. Closed Submissions Guard
  if (params.action === 'v7_init_human_challenge' || params.action === 'request_challenge_v7' || params.action === 'request_challenge') {
    return jsonResponse_({
      ok: false,
      closed: true,
      error: 'Genesis Whitelist registration is officially closed. Snapshot compilation and audit are in progress.'
    });
  }

  return jsonResponse_({
    ok: true,
    service: 'Dudes Craft Genesis Allocation API',
    version: '17.0-DualAllocation-FinalSnapshot',
    status: 'LIVE',
    timestamp: new Date().toISOString()
  });
}

/**
 * doPost — PERMANENTLY CLOSED (No new submissions can be added to Google Sheets).
 */
function doPost(e) {
  return jsonResponse_({
    ok: false,
    closed: true,
    error: 'Genesis Whitelist registration is officially closed. No further submissions are accepted into the database.'
  });
}

/**
 * High-speed allocation verification against GDT and FCFS sheets with 5-minute RAM caching.
 */
function checkAllocation_(normWallet) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('alloc_' + normWallet);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (_) {}
  }

  const ss = getSpreadsheet_();
  let gdtSheet = ss.getSheetByName(GDT_SHEET);
  let fcfsSheet = ss.getSheetByName(FCFS_SHEET);

  let gdtMatch = null;
  let fcfsMatch = null;

  // Check GDT sheet
  if (gdtSheet && gdtSheet.getLastRow() > 1) {
    const gdtData = gdtSheet.getRange(2, 3, gdtSheet.getLastRow() - 1, 2).getValues();
    for (let i = 0; i < gdtData.length; i++) {
      if (String(gdtData[i][0] || '').toLowerCase().trim() === normWallet) {
        gdtMatch = {
          serial: String(gdtData[i][1] || '').trim(),
          tier: 'GDT Guaranteed Allocation'
        };
        break;
      }
    }
  }

  // Check FCFS sheet
  if (fcfsSheet && fcfsSheet.getLastRow() > 1) {
    const fcfsData = fcfsSheet.getRange(2, 3, fcfsSheet.getLastRow() - 1, 2).getValues();
    for (let i = 0; i < fcfsData.length; i++) {
      if (String(fcfsData[i][0] || '').toLowerCase().trim() === normWallet) {
        fcfsMatch = {
          serial: String(fcfsData[i][1] || '').trim(),
          tier: 'FCFS Allocation'
        };
        break;
      }
    }
  }

  let res;
  if (gdtMatch && fcfsMatch) {
    res = {
      ok: true,
      eligible: true,
      tier: 'BOTH',
      headline: 'Dual Allocation Confirmed! 🎉',
      message: 'Congratulations! You are eligible for BOTH the GDT Guaranteed Allocation and the FCFS (First-Come, First-Served) Allocation!',
      badgeText: '👑 GDT GUARANTEED + ⚡ FCFS ALLOCATION',
      serial: gdtMatch.serial || fcfsMatch.serial,
      gdtSerial: gdtMatch.serial,
      fcfsSerial: fcfsMatch.serial,
      allocations: ['GDT Guaranteed Allocation', 'FCFS Allocation']
    };
  } else if (gdtMatch) {
    res = {
      ok: true,
      eligible: true,
      tier: 'GDT',
      headline: 'Guaranteed Allocation Confirmed! 👑',
      message: 'Congratulations! You are eligible for the GDT Guaranteed Allocation!',
      badgeText: '👑 GDT GUARANTEED MINT',
      serial: gdtMatch.serial,
      allocations: ['GDT Guaranteed Allocation']
    };
  } else if (fcfsMatch) {
    res = {
      ok: true,
      eligible: true,
      tier: 'FCFS',
      headline: 'FCFS Allocation Confirmed! ⚡',
      message: 'Congratulations! You are eligible for the FCFS (First-Come, First-Served) Allocation!',
      badgeText: '⚡ FCFS ALLOCATION',
      serial: fcfsMatch.serial,
      allocations: ['FCFS Allocation']
    };
  } else {
    res = {
      ok: true,
      eligible: false,
      tier: 'NONE',
      headline: 'Wallet Not Whitelisted 🔒',
      message: 'This wallet address is not currently on the Genesis Allocation Whitelist.',
      badgeText: 'NOT ELIGIBLE',
      allocations: []
    };
  }

  try {
    cache.put('alloc_' + normWallet, JSON.stringify(res), 300);
  } catch (_) {}

  return res;
}

/**
 * Migration & Setup: Rebuilds clean GDT (475 addresses) and FCFS (website submissions + batch) tabs.
 */
function rebuildGdtAndFcfsSheets() {
  const ss = getSpreadsheet_();
  
  // 1. Collect website submissions from Submissions sheet (Rows 2 to 264)
  const subSheet = ss.getSheetByName('Submissions');
  const websiteFcfs = [];
  if (subSheet && subSheet.getLastRow() > 1) {
    const data = subSheet.getRange(2, 1, subSheet.getLastRow() - 1, 8).getValues();
    for (let i = 0; i < data.length; i++) {
      const ts = data[i][0];
      const tw = String(data[i][1] || '').trim();
      const wl = String(data[i][2] || '').trim().toLowerCase();
      const ser = String(data[i][3] || '').trim();
      const tier = String(data[i][4] || '').trim();
      
      // If it was an organic website submission (not 'GDT Allocation')
      if (wl && /^0x[a-f0-9]{40}$/i.test(wl) && tier !== 'GDT Allocation') {
        websiteFcfs.push({
          timestamp: ts,
          twitter: tw,
          wallet: wl,
          serial: ser || ('DC-' + hex4_() + '-' + hex4_()),
          tier: 'Website Whitelist (FCFS)'
        });
      }
    }
  }
  Logger.log('Organic website submissions found: ' + websiteFcfs.length);

  // 2. Collect entries from existing FCFS sheet
  const oldFcfsSheet = ss.getSheetByName(FCFS_SHEET);
  const batchFcfs = [];
  if (oldFcfsSheet && oldFcfsSheet.getLastRow() > 1) {
    const data = oldFcfsSheet.getRange(2, 1, oldFcfsSheet.getLastRow() - 1, 8).getValues();
    for (let i = 0; i < data.length; i++) {
      const ts = data[i][0];
      const tw = String(data[i][1] || '').trim();
      const wl = String(data[i][2] || '').trim().toLowerCase();
      const ser = String(data[i][3] || '').trim();
      if (wl && /^0x[a-f0-9]{40}$/i.test(wl)) {
        batchFcfs.push({
          timestamp: ts,
          twitter: tw,
          wallet: wl,
          serial: ser || ('DC-' + hex4_() + '-' + hex4_()),
          tier: 'FCFS Allocation'
        });
      }
    }
  }
  Logger.log('Batch FCFS entries found: ' + batchFcfs.length);

  // 3. Combine and Deduplicate all FCFS
  const allFcfs = [];
  const seenFcfs = new Set();

  for (const item of websiteFcfs) {
    if (!seenFcfs.has(item.wallet)) {
      seenFcfs.add(item.wallet);
      allFcfs.push(item);
    }
  }
  for (const item of batchFcfs) {
    if (!seenFcfs.has(item.wallet)) {
      seenFcfs.add(item.wallet);
      allFcfs.push(item);
    }
  }
  Logger.log('Total unique FCFS entries: ' + allFcfs.length);

  // 4. Create or replace GDT Sheet with the 475 official GDT addresses
  const gdtSet = new Set(OFFICIAL_GDT_WALLETS.map(w => w.toLowerCase().trim()));
  let gdtSheet = ss.getSheetByName(GDT_SHEET);
  if (gdtSheet) {
    ss.deleteSheet(gdtSheet);
  }
  gdtSheet = ss.insertSheet(GDT_SHEET);

  const gdtHeaders = ['Timestamp', 'Twitter Handle', 'Wallet Address', 'Serial', 'Tier / Source', 'Dual Status'];
  gdtSheet.appendRow(gdtHeaders);
  gdtSheet.getRange(1, 1, 1, 6)
          .setBackground('#D97706') // Amber Gold
          .setFontColor('#FFFFFF')
          .setFontWeight('bold')
          .setHorizontalAlignment('center');
  gdtSheet.setFrozenRows(1);

  const nowStr = Utilities.formatDate(new Date(), 'Asia/Dhaka', 'dd/MM/yyyy HH:mm:ss');
  const gdtRows = [];
  let dualCount = 0;

  for (let i = 0; i < OFFICIAL_GDT_WALLETS.length; i++) {
    const addr = OFFICIAL_GDT_WALLETS[i].trim();
    const isAlsoFcfs = seenFcfs.has(addr.toLowerCase());
    if (isAlsoFcfs) dualCount++;

    gdtRows.push([
      nowStr,
      '',
      addr,
      'DC-' + hex4_() + '-' + hex4_(),
      'GDT Guaranteed Allocation',
      isAlsoFcfs ? 'Dual Allocation: GDT + FCFS' : 'GDT Only'
    ]);
  }

  if (gdtRows.length > 0) {
    gdtSheet.getRange(2, 1, gdtRows.length, 6).setValues(gdtRows);
    gdtSheet.autoResizeColumns(1, 6);
  }

  // 5. Create or replace FCFS Sheet
  if (oldFcfsSheet) {
    ss.deleteSheet(oldFcfsSheet);
  }
  const newFcfsSheet = ss.insertSheet(FCFS_SHEET);
  const fcfsHeaders = ['Timestamp', 'Twitter Handle', 'Wallet Address', 'Serial', 'Tier / Source', 'Dual Status'];
  newFcfsSheet.appendRow(fcfsHeaders);
  newFcfsSheet.getRange(1, 1, 1, 6)
             .setBackground('#6B21A8') // Royal Purple
             .setFontColor('#FFFFFF')
             .setFontWeight('bold')
             .setHorizontalAlignment('center');
  newFcfsSheet.setFrozenRows(1);

  const fcfsRows = [];
  for (const item of allFcfs) {
    const isAlsoGdt = gdtSet.has(item.wallet.toLowerCase());
    fcfsRows.push([
      item.timestamp || nowStr,
      item.twitter || '',
      item.wallet,
      item.serial,
      item.tier,
      isAlsoGdt ? 'Dual Allocation: GDT + FCFS' : 'FCFS Only'
    ]);
  }

  if (fcfsRows.length > 0) {
    newFcfsSheet.getRange(2, 1, fcfsRows.length, 6).setValues(fcfsRows);
    newFcfsSheet.autoResizeColumns(1, 6);
  }

  Logger.log('DATABASE SETUP SUCCESSFUL!');
  Logger.log('GDT Sheet: ' + gdtRows.length + ' entries.');
  Logger.log('FCFS Sheet: ' + fcfsRows.length + ' entries.');
  Logger.log('Dual-eligible wallets (in both GDT & FCFS): ' + dualCount);
}

/**
 * Admin Helper: Append new batch of GDT wallets.
 */
function appendGdtBatch(walletsArray) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(GDT_SHEET);
  if (!sheet) throw new Error('GDT sheet not found');
  
  const lastRow = sheet.getLastRow();
  const existing = new Set();
  if (lastRow > 1) {
    const data = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
    for (let i = 0; i < data.length; i++) {
      const w = String(data[i][0] || '').toLowerCase().trim();
      if (w) existing.add(w);
    }
  }
  
  const nowStr = Utilities.formatDate(new Date(), 'Asia/Dhaka', 'dd/MM/yyyy HH:mm:ss');
  const rows = [];
  let added = 0;
  for (let i = 0; i < walletsArray.length; i++) {
    const addr = String(walletsArray[i] || '').trim();
    if (!addr || existing.has(addr.toLowerCase())) continue;
    existing.add(addr.toLowerCase());
    added++;
    rows.push([nowStr, '', addr, 'DC-' + hex4_() + '-' + hex4_(), 'GDT Guaranteed Allocation', 'Pending Audit']);
  }
  if (rows.length > 0) {
    sheet.getRange(lastRow + 1, 1, rows.length, 6).setValues(rows);
  }
  return { added: added, total: sheet.getLastRow() - 1 };
}

/**
 * Admin Helper: Append new batch of FCFS wallets.
 */
function appendFcfsBatch(walletsArray) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(FCFS_SHEET);
  if (!sheet) throw new Error('FCFS sheet not found');
  
  const lastRow = sheet.getLastRow();
  const existing = new Set();
  if (lastRow > 1) {
    const data = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
    for (let i = 0; i < data.length; i++) {
      const w = String(data[i][0] || '').toLowerCase().trim();
      if (w) existing.add(w);
    }
  }
  
  const nowStr = Utilities.formatDate(new Date(), 'Asia/Dhaka', 'dd/MM/yyyy HH:mm:ss');
  const rows = [];
  let added = 0;
  for (let i = 0; i < walletsArray.length; i++) {
    const addr = String(walletsArray[i] || '').trim();
    if (!addr || existing.has(addr.toLowerCase())) continue;
    existing.add(addr.toLowerCase());
    added++;
    rows.push([nowStr, '', addr, 'DC-' + hex4_() + '-' + hex4_(), 'FCFS Allocation', 'Pending Audit']);
  }
  if (rows.length > 0) {
    sheet.getRange(lastRow + 1, 1, rows.length, 6).setValues(rows);
  }
  return { added: added, total: sheet.getLastRow() - 1 };
}
