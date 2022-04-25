import io
import json
import os
import re

import django
from Bio import AlignIO, Phylo
from Bio.Align import AlignInfo
from Bio.Phylo.TreeConstruction import DistanceCalculator, DistanceTreeConstructor
from django.contrib import messages
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.forms import AuthenticationForm
from django.http import HttpResponse
from django.shortcuts import render, redirect
from myapp.forms import NewUserForm
from myapp.models import Sequence

def treeAnalyzer(request):
    context = {}
    if request.method == 'POST':

        uploaded_file = request.FILES['document']
        # načítanie vstupného súboru ako reťazca
        str_text = ''
        for line in uploaded_file:
            if line.decode != ' ':
                str_text = str_text + line.decode()

        # každá sekvencia začína jej názvom a potom samotným vyjadrením sekvencie
        # počet sekvencií je teda rovný polovici všektých riadkov
        num_of_sequence = (len(str_text.splitlines())/2)
        sequence_length = str(len(str_text.splitlines()[1]))
        num_of_gaps = 0

        # vytvorenie poľa o veľkosti počtu sekvencií
        list = [0] * (int(sequence_length))

        #prechádzanie všetkých sekvencií, v prípade, ak sa na danom mieste nachádza medzera, pripočítaj 1 ku skóre
        for line in str_text.splitlines():
            # '>' je znak názvu sekvencie
            if(not line.startswith('>')):
                # hľadaj medzery --> '-'
                for m in re.finditer('-', line):
                    num_of_gaps +=1
                    for i in range (m.start(), m.end()):
                        list[i]+=1

        # skladanie výstupu do štruktúry .csv
        output_str = 'id,value,\r\n'

        # získanie percentuálnej hodnoty výskytu medzery pre každú pozíciu
        for i in range (len(list)):
            list[i]= list[i] *100 / num_of_sequence
            # skladanie výstupu do štruktúry .csv
            output_str += str(i)+','+str(int(list[i]))+',\r\n'

        # typ matice, zadaný na strane front-endu
        matrix = request.POST['matrix']
        # typ algoritmu pre výpočet fylogenetického stromu, zadaný na strane front-endu
        tree_type = request.POST['tree']

        # ak užívateľ chce uložiť dáta do databázy
        # hodnoty pre fylogenetický strom budú pridané neskôr, po výpočte
        if 'database' in request.POST:
            sequence = Sequence()
            if request.user.is_authenticated:
                print(request.user.password)
                current_user = request.user
                sequence.name = uploaded_file.name
                sequence.sequence = json.dumps(str_text.replace("(", "").replace(")", ""))
                sequence.author = current_user
                sequence.one_sequence_length = sequence_length
                sequence.sequence_count = num_of_sequence
                sequence.options = "MATRIX: "+matrix+" TREE: "+tree_type + " GAPS: "+ str(num_of_gaps)
                sequence.gap_statistics = output_str
                sequence.tree = 'N\A'
                sequence.phyloxmltree = 'N\A'
                sequence.nexmltree = 'N\A'
                sequence.nexustree = 'N\A'
                sequence.save()

        # ošetrenie reťazca od nechcených znakov
        upload_file_string = io.StringIO(str_text.replace("(", "").replace(")", ""))  # takes string as arg

        # načítanie sekvencií do knižnice biopython
        alignment_s = AlignIO.read(upload_file_string, 'fasta')
        alignment = AlignIO.MultipleSeqAlignment(alignment_s)

        # výpočet dištančnej matice
            # matrix - typ skórovacej matice
            # tree_type - UPGMA/NJ
        calculator = DistanceCalculator(matrix)
        constructor = DistanceTreeConstructor(calculator, tree_type)

        # výpočet fylogenetického stromu
        tree = constructor.build_tree(alignment)

        print(tree)

        # cstf - unikátny identifikátor, pre zvládnutie viacerých používateľov súčasne
        django_csrf = django.middleware.csrf.get_token(request)

        # dočasné uloženie fylogenetického stromu a jeho následná konverzia
        Phylo.write(tree, django_csrf+"converted.nwk", "newick")
        Phylo.convert(django_csrf+"converted.nwk", "newick", "original.xml", "phyloxml")
        Phylo.convert(django_csrf+"converted.nwk", "newick", django_csrf+"tree1.xml", "nexml")
        Phylo.convert(django_csrf+"converted.nwk", "newick", django_csrf+"tree1.nex", "nexus")
        Phylo.convert(django_csrf+"converted.nwk", "newick", django_csrf+"tree2.xml", "phyloxml")

        newickTree = open(django_csrf+'converted.nwk', encoding='utf-8').read()
        nexmlTree = open(django_csrf+'tree1.xml', encoding='utf-8').read()
        nexusTree = open(django_csrf+'tree1.nex', encoding='utf-8').read()
        phyloxmlTree = open(django_csrf+'tree2.xml', encoding='utf-8').read()

        # uloženie vypočítaných stromov do databázy
        if 'database' in request.POST:
            if request.user.is_authenticated:
                sequence.tree = json.dumps(newickTree)
                sequence.nexmltree = json.dumps(nexmlTree)
                sequence.nexustree = json.dumps(nexusTree)
                sequence.phyloxmltree = json.dumps(phyloxmlTree)
                sequence.save()

        # vytvorenie kontextu pre front-end

        # newick - strom vo formáte newick
        context['newick'] = json.dumps(newickTree).replace("'","")
        # alignment - sekvencie vo formáte fasta
        context['alignment'] = alignment
        # počet sekvencií
        context['num_of_sequence'] = num_of_sequence
        # dĺžka jednotlivých sekvencií
        context['sequence_length'] = sequence_length
        # original_sequence - sekvencie vo formáte fasta
        context['original_sequence'] = json.dumps(str_text.replace("(", "").replace(")", "").replace("\n", "<br>").replace("\r", ""))

        #zmazanie súborov
        os.remove(django_csrf + "tree1.xml")
        os.remove(django_csrf + "tree1.nex")
        os.remove(django_csrf + "tree2.xml")
        os.remove(django_csrf + "converted.nwk")

    return render(request, 'tree_analyzer.html', context)

#sekvenčný analyzátor
def sequenceAnalyzer(request):
    context = {}
    if request.method == 'POST':
        # spracovanie nahraného súboru
        uploaded_file = request.FILES['document']

        # prevod súboru do reťazca
        frontend_sequencies = ''
        for line in uploaded_file:
            if line.decode != ' ':
                frontend_sequencies = frontend_sequencies + line.decode()


        string_to_find = request.POST['string_to_find']
        zoom = request.POST['zoom_upload']

        # pridanie hodnoty zoom do kontextu
        context['zoom'] = zoom
        # pridanie hodnoty hľadaného reťazca do kontextu
        context['string_to_find'] = string_to_find

        # ošetrenie reťazca
        frontend_sequencies = frontend_sequencies.replace('[', '').replace(']', '').replace(',', '\n').replace(' ', '').replace("'", '').replace('\\r', '')

        # každá sekvencia začína jej názvom a potom samotným vyjadrením sekvencie
        # počet sekvencií je teda rovný polovici všektých riadkov
        num_of_sequence = len(frontend_sequencies.splitlines()) / 2
        #dĺžka sekvencií
        sequence_length = str(len(frontend_sequencies.splitlines()[1]))

        # pole o počte prvkov rovnému dĺžke sekvencií
        result = [0] * (int(sequence_length))

        # prechádzanie všetkých sekvencií, v prípade, ak sa na danom mieste nachádza hľadaný reťazec, pripočítaj 1 ku skóre na daných pozíciách
        for line in frontend_sequencies.splitlines():
            if (not line.startswith('>')):
                for m in re.finditer(string_to_find, line):
                    for i in range(m.start(), m.end()):
                        result[i] += 1

        # skladanie výstupu do štruktúry .csv
        output_str = 'id,value,\n'

        # získanie percentuálnej hodnoty výskytu medzery pre každú pozíciu
        for i in range(len(result)):
            result[i] = result[i] * 100 / num_of_sequence
            # skladanie výstupu do štruktúry .csv
            output_str += str(i) + ',' + str(int(result[i])) + ',\n'

        context['sequence_analyze'] = json.dumps(output_str)
        context['sequence_length'] = json.dumps(sequence_length)
        context['sequence'] = json.dumps(frontend_sequencies)

    return render(request, 'sequence_analyzer.html', context)

#sekvenčný analyzátor
def sequenceAnalyzerJQuery(request):
    if request.method == 'POST':
        # priradenie nahranej sekvencie do premennej
        uploaded_sequence = request.POST['sequence']
        frontend_sequencies = uploaded_sequence
        # každá sekvencia začína jej názvom a potom samotným vyjadrením sekvencie
        # počet sekvencií je teda rovný polovici všektých riadkov
        num_of_sequence = len(frontend_sequencies.splitlines())/2

        # získanie hľadaného reťazca
        string_to_find = request.POST['string_to_find']

        #dĺžka sekvencií
        sequence_length = str(len(frontend_sequencies.splitlines()[1]))

        # pole o počte prvkov rovnému dĺžke sekvencií
        result = [0] * (int(sequence_length))

        # prechádzanie všetkých sekvencií, v prípade, ak sa na danom mieste nachádza hľadaný reťazec, pripočítaj 1 ku skóre na daných pozíciách
        for line in frontend_sequencies.splitlines():
            if (not line.startswith('>')):
                for m in re.finditer(string_to_find, line):
                    for i in range(m.start(), m.end()):
                        result[i] += 1

        output_str = 'id,value,\n'
        # získanie percentuálnej hodnoty výskytu medzery pre každú pozíciu
        for i in range(len(result)):
            result[i] = result[i] * 100 / num_of_sequence
            # skladanie výstupu do štruktúry .csv
            output_str += str(i) + ',' + str(int(result[i])) + ',\n'

    result = json.dumps(output_str)

    return HttpResponse(result, status=200)

# výpočet konsenzuálnej sekvencie
def node_consensus(request):
    # načítanie zoznamu sekvencií pre výpočet konsenzuálnej sekvencie
    frontend_sequencies = str(request.POST.getlist('array[]'))
    # hraničná hodnota zhody medzi sekvenciami
    consensus_threshold = str(request.POST.getlist('consensus'))

    # spracovanie vstupu
    frontend_sequencies = frontend_sequencies.replace('[', '').replace(']', '').replace(',', '\n').replace(' ', '').replace("'", '').replace('\\r','')
    # spracovanie vstupu
    consensus_threshold = consensus_threshold.replace('[', '').replace(']', '').replace(',', '\n').replace(' ', '').replace("'", '')

    # predeleni hodnoty z percentuálneho rozsahu do rozsahu 0.0 až 1.0
    consensus_threshold = float(consensus_threshold) / 100

    # načítanie sekvencií do súboru reprezentovaného v pamäti
    in_memory_file = io.StringIO(frontend_sequencies)
    alignment_s = AlignIO.read(in_memory_file, 'fasta')
    #výpočet konsenzuálnej sekvencie zo zoznamuú
    consensus = AlignInfo.SummaryInfo(alignment_s).dumb_consensus(threshold=consensus_threshold, ambiguous='-', require_multiple=2)

    context = {}
    context['subtree_consensus'] = consensus.encode('utf8')

    # vrátenie odpovede na front-end
    return HttpResponse(consensus, status=200)

# registrácia používateľa
def register_request(request):
    if request.method == "POST":
        form = NewUserForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, "Registration successful.")
        else:
            messages.error(request, "Unsuccessful registration. Invalid information.")
    form = NewUserForm()
    return render(request=request, template_name="register.html", context={"register_form": form})

# prihlásenie pouzívateľa
def login_request(request):
    # v prípade, že užívateľ už je prihlásený, presmerovanie na sekciu TREE ANALYZER
    if request.user.is_authenticated:
        return redirect('/upload')

    if request.method == "POST":
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                messages.info(request, f"You are now logged in as {username}.")
                return redirect("upload")
            else:
                messages.error(request, "Invalid username or password.")
        else:
            messages.error(request, "Invalid username or password.")
    form = AuthenticationForm()
    return render(request=request, template_name="login.html", context={"login_form": form})

# odhlásenie používateľa
def logout_request(request):
    logout(request)
    messages.info(request, "You have successfully logged out.")
    return redirect("/login")

# sekcia MOJE PROJEKTY - vrátenie záznamov užívateľa na základe jeho ID
def my_projects(request):
    context = {}
    if request.user:
        current_user = request.user
        list = Sequence.objects.filter(author=current_user)
        context['sequence'] = list.values()

    return render(request, 'history.html', context)

# sekcia TOOLTIP
def tooltip(request):
    return render(request, 'tooltip.html')

# zmazanie záznamu na základe unikátneho identifikátora
def delete(request):
    global id, current_user

    if request.user:
        current_user = request.user

    if request.method == "POST":
        id = str(request.POST.getlist('id')).replace('[','').replace("'","").replace("]","")

    obj = Sequence.objects.get(pk=id)
    if(obj.author.id==current_user.id):
        Sequence.objects.filter(id=id).delete()

    return HttpResponse('true', status=200)

# vrátenie položky gap_statistics z databázy pre danú sekvenciu na základe jej unikátneho identifikátora
def getGapStatistics(request):
    global id
    if request.method == "POST":
        id = str(request.POST.getlist('id')).replace('[','').replace("'","").replace("]","")
    gap_statistic = Sequence.objects.get(pk=id).gap_statistics
    gap_statistic.replace("\n",'%0A')
    return HttpResponse(gap_statistic, status=200)


# vrátenie hodnoty sekvencie z databázy pre danú sekvenciu na základe jej unikátneho identifikátora
def getSequenceString(request):
    global id
    if request.method == "POST":
        id = str(request.POST.getlist('id')).replace('[','').replace("'","").replace("]","")
    sequence = Sequence.objects.get(pk=id).sequence

    return HttpResponse(sequence, status=200)

# vrátenie stromu vo formáte newick z databázy pre danú sekvenciu na základe jej unikátneho identifikátora
def getNewickTree(request):
    global id
    if request.method == "POST":
        id = str(request.POST.getlist('id')).replace('[','').replace("'","").replace("]","")
    tree = Sequence.objects.get(pk=id).tree

    return HttpResponse(tree, status=200)

# vrátenie stromu vo formáte nexus z databázy pre danú sekvenciu na základe jej unikátneho identifikátora
def getNexusTree(request):
    global id
    if request.method == "POST":
        id = str(request.POST.getlist('id')).replace('[','').replace("'","").replace("]","")
    tree = Sequence.objects.get(pk=id).nexustree

    return HttpResponse(tree, status=200)

# vrátenie stromu vo formáte nexml z databázy pre danú sekvenciu na základe jej unikátneho identifikátora
def getNexmlTree(request):
    global id
    if request.method == "POST":
        id = str(request.POST.getlist('id')).replace('[','').replace("'","").replace("]","")
    tree = Sequence.objects.get(pk=id).nexmltree

    return HttpResponse(tree, status=200)

# vrátenie stromu vo formáte phyloxml z databázy pre danú sekvenciu na základe jej unikátneho identifikátora
def getPhyloxmlTree(request):
    global id
    if request.method == "POST":
        id = str(request.POST.getlist('id')).replace('[','').replace("'","").replace("]","")
    tree = Sequence.objects.get(pk=id).phyloxmltree

    return HttpResponse(tree, status=200)






