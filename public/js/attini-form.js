
(function initform() {

    var formname = 'requisicaodefiliacaov5';
    if (typeof window.MauticFormCallback == 'undefined') {
        window.MauticFormCallback = {};
    }


    window.MauticFormCallback[formname] = {
        onValidateField: function (data) {
            const form = document.getElementById("mauticform_" + formname);
            console.log(data.fieldKey, "validacao")
            if (data.fieldKey == "cnpj") {


                const CNPJ = form.elements.namedItem("mauticform[cnpj]").value;
                console.log(CNPJ);
                const valido = validaCNPJ(CNPJ);
                if (!valido) {
                    form.elements.namedItem("mauticform[ccodint]").value = "";
                    container = document.querySelector('div[data-container-for="cnpj"]');
                    container.classList.add("mauticform-has-error");
                    const el = container.querySelector(".mauticform-custom-errormsg");
                    el.innerHTML = "CNPJ Inválido";
                    return false;
                }

                const cCodInt = CNPJ.replace(/[^\d]/g, '')
                form.elements.namedItem("mauticform[cnpj]").value = cCodInt.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
                form.elements.namedItem("mauticform[ccodint]").value = cCodInt
                return null;
            }

            if (data.fieldKey == "telefone_financeiro" || data.fieldKey == "telefone_gerente" || data.fieldKey == "telefone_comprador" ) {
                let telFin = form.elements.namedItem("mauticform[telefone_financeiro]").value;
                let telPri = form.elements.namedItem("mauticform[telefone]").value;
                let telGer = form.elements.namedItem("mauticform[telefone_gerente]").value;
                let telComp = form.elements.namedItem("mauticform[telefone_comprador]").value;

                telFin = telFin.replace(/\D/, "");
                telPri = telPri.replace(/\D/, "");
                telGer = telGer.replace(/\D/, "");
                telComp = telComp.replace(/\D/, "");

                let erroDuplicidade = false;

                if( data.fieldKey == "telefone_financeiro" && telFin !== "" && telFin == telPri  )
                    { erroDuplicidade = true; }

                if( data.fieldKey == "telefone_gerente" && telGer !== "" && [telPri,telFin].includes(telGer)  )
                    { erroDuplicidade = true; }
                
                if( data.fieldKey == "telefone_comprador" && telComp !== "" && [telPri,telFin, telGer].includes(telComp)  )
                    { erroDuplicidade = true; }

                if (erroDuplicidade) {
                    container = document.querySelector(`div[data-container-for="${data.fieldKey}"]`);
                    container.classList.add("mauticform-has-error");
                    const el = container.querySelector(".mauticform-custom-errormsg");
                    el.innerHTML = "Os telefones dos Contatos (Principal, Financeiro, Gerente de Loja  e/ou Comprador) não podem ser iguais.";
                    return false;
                }

            }


            if (
               data.fieldKey == "sobrenome_financeiro" || data.fieldKey == "sobrenome_gerente" || data.fieldKey == "sobrenome_comprador" 
               || data.fieldKey == "nome_financeiro" || data.fieldKey == "nome_gerente" || data.fieldKey == "nome_comprador" 
            ) {

                const contatoTipo = data.fieldKey.replace(/^[^_]*_/, "")
                const contatoCampo = data.fieldKey.replace(/_.*$/, "")

                let NomePrincipal = form.elements.namedItem("mauticform[primeiro_nome]").value + " " + form.elements.namedItem("mauticform[sobrenome]").value
                let NomeFinanceiro = form.elements.namedItem("mauticform[nome_financeiro]").value + " " + form.elements.namedItem("mauticform[sobrenome_financeiro]").value
                let NomeGerente = form.elements.namedItem("mauticform[nome_gerente]").value + " " + form.elements.namedItem("mauticform[sobrenome_gerente]").value
                let NomeComprador = form.elements.namedItem("mauticform[nome_comprador]").value + " " + form.elements.namedItem("mauticform[sobrenome_comprador]").value

                
                let Telefone = form.elements.namedItem(`mauticform[telefone_${contatoTipo}]`).value
                let Email = form.elements.namedItem(`mauticform[email_${contatoTipo}]`).value
                
                if( 
                    (Telefone !== "" || Email !== "") 
                    && form.elements.namedItem(`mauticform[${data.fieldKey}]`).value == ""
                ) {
                    container = document.querySelector(`div[data-container-for="${data.fieldKey}"]`);
                    container.classList.add("mauticform-has-error");
                    const el = container.querySelector(".mauticform-custom-errormsg");
                    el.innerHTML = `${contatoCampo} do contato é obrigatório quando informado seu telefone ou email`;
                    return false;
                }


                NomePrincipal = NomePrincipal.replace(/\s{1,}/g, " ").trim().toLocaleLowerCase();
                NomeFinanceiro = NomeFinanceiro.replace(/\s{1,}/g, " ").trim().toLocaleLowerCase();
                NomeGerente = NomeGerente.replace(/\s{1,}/g, " ").trim().toLocaleLowerCase();
                NomeComprador = NomeComprador.replace(/\s{1,}/g, " ").trim().toLocaleLowerCase();

                let erroDuplicidade = false;

                if( data.fieldKey == "sobrenome_financeiro" && NomeFinanceiro !== "" && NomeFinanceiro == NomePrincipal  )
                    { erroDuplicidade = true; }

                if( data.fieldKey == "sobrenome_gerente" && NomeGerente !== "" && [NomePrincipal,NomeFinanceiro].includes(NomeGerente)  )
                    { erroDuplicidade = true; }
                
                if( data.fieldKey == "sobrenome_comprador" && NomeComprador !== "" && [NomePrincipal,NomeFinanceiro, NomeGerente].includes(NomeComprador)  )
                    { erroDuplicidade = true; }

                if (erroDuplicidade) {
                    container = document.querySelector(`div[data-container-for="${data.fieldKey}"]`);
                    container.classList.add("mauticform-has-error");
                    const el = container.querySelector(".mauticform-custom-errormsg");
                    el.innerHTML = "Os Contatos Principais ou Adicionais não pode ser a mesma pessoa. Os contatos adicionais (Financeiro, Gerente ou Comprador) não são obrigatórios, pode deixá-los em branco caso forem a mesma pessoa.";
                    return false;
                }

            }


            if (
                ( data.fieldKey == "telefone_financeiro" || data.fieldKey == "telefone_gerente" || data.fieldKey == "telefone_comprador" 
                || data.fieldKey == "email_financeiro" || data.fieldKey == "email_gerente" || data.fieldKey == "email_comprador" )                
             ) {
 
                 let contatoTipo = data.fieldKey.replace(/^[^_]*_/, "") // financeiro, gerente ou comprador
                 let contatoCampo = data.fieldKey.replace(/_.*$/, "") //telefone ou email

                 let nomeContato = form.elements.namedItem(`mauticform[nome_${contatoTipo}]`).value + " " + form.elements.namedItem(`mauticform[sobrenome_${contatoTipo}]`).value
                 nomeContato = nomeContato.replace(/\s{1,}/g, " ").trim().toLocaleLowerCase();
                 let infoContato =  form.elements.namedItem(`mauticform[telefone_${contatoTipo}]`).value + form.elements.namedItem(`mauticform[email_${contatoTipo}]`).value

                 let camposComErro = [`telefone_${contatoTipo}`, `email_${contatoTipo}`]
                 if( nomeContato !== "" && infoContato == "" ) {
                    const NomesAmigaveis = {
                        "gerente":"Gerente de Loja",
                        "financeiro":"Contato Financeiro",
                        "comprador":"Comprador"
                    }

                    camposComErro.forEach( fieldKey => {
                        container = document.querySelector(`div[data-container-for="${fieldKey}"]`);
                        container.classList.add("mauticform-has-error");
                        const el = container.querySelector(".mauticform-custom-errormsg");
                        el.innerHTML = `É necessário pelo menos um canal de comunicação (email e/ou telefone) para cadastrar o ${NomesAmigaveis[contatoTipo]}`;
                    });
                    return false;
                 } else {

                    camposComErro.forEach( fieldKey => {
                        container = document.querySelector(`div[data-container-for="${fieldKey}"]`);                        
                        container.classList.remove("mauticform-has-error");
                       // const el = container.querySelector(".mauticform-custom-errormsg");
                        //el.innerHTML = "";
                    });

                 }

             }

            return null;
        },
        onResponseEnd: function (response) {
            if (response.success) return true;
            // before form submit
            console.log(response)
            const globalErrors = new Array()

            for (var field in response.validationErrors) {
                //check if validation Error is not a field, but an index
                if (/^\d+$/.test(field)) {
                    globalErrors.push(response.validationErrors[field]);
                    continue;
                }
            }

            if (globalErrors.length) {
                var el = document.getElementById("mauticform_" + formname + "_error")
                el.scrollIntoView({ behavior: 'smooth' });
            }

        }

    };

    function validaCNPJ(cnpj) {
        var b = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        var c = String(cnpj).replace(/[^\d]/g, '')

        if (c.length !== 14)
            return false

        if (/0{14}/.test(c))
            return false

        for (var i = 0, n = 0; i < 12; n += c[i] * b[++i]);
        if (c[12] != (((n %= 11) < 2) ? 0 : 11 - n))
            return false

        for (var i = 0, n = 0; i <= 12; n += c[i] * b[i++]);
        if (c[13] != (((n %= 11) < 2) ? 0 : 11 - n))
            return false

        return true
    }
})()

