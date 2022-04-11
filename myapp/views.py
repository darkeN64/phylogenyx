import io
import json
import os
import random
import re
from itertools import islice

import django
import matplotlib.pyplot as plt
from Bio import AlignIO, Phylo, pairwise2
from Bio.Align import AlignInfo
from Bio.Align.Applications import MuscleCommandline
from Bio.Phylo.TreeConstruction import DistanceCalculator, DistanceTreeConstructor
from Bio.Seq import Seq
from Bio.pairwise2 import format_alignment
from django.contrib import messages
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.forms import AuthenticationForm
from django.core.files.storage import FileSystemStorage
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.template import RequestContext
from django.utils.safestring import mark_safe
from django.views.generic import TemplateView

from myapp.forms import NewUserForm
from myapp.models import Sequence


class Home(TemplateView):
    template_name = 'index.html'

def options(request):
    #csrf = str(request.headers['Cookie'])
    #print('csrf options ' + csrf)
    #print("starting subtree consensus")
    options = request.POST.getlist('data')
    #opt = str('options123')
    #with open(opt, 'w') as f:
        #f.write(str(options))
    #print('options' + str(options))
    print('graphidentity\n' + str(request.COOKIES.get('graphidentity')))
    print('distancematrix\n' + str(request.COOKIES.get('distancematrix')))
    print('treecalculation\n' + str(request.COOKIES.get('treecalculation')))
    return HttpResponse('', status=200)


def upload(request):
    context = {}

    if request.method == 'POST':

        uploaded_file = request.FILES['document']

        print('uploadname ' + str(uploaded_file))
        print('tree is : \n' + request.POST['tree'])
        print('matrix is : \n' + request.POST['matrix'])


        str_text = ''
        for line in uploaded_file:
            if line.decode != ' ':
                str_text = str_text + line.decode()


        num_of_sequence = (len(str_text.splitlines())/2)
        sequence_length = str(len(str_text.splitlines()[1]))

        num_of_gaps = 0

        list = [0] * (int(sequence_length))
        print('forline')
        for line in str_text.splitlines():
            if(not line.startswith('>')):
                for m in re.finditer('-', line):
                    num_of_gaps +=1
                    for i in range (m.start(), m.end()):
                        list[i]+=1


        print('count is : +'+ str(str_text.count('-')))
        output_str = 'id,value,\r\n'

        for i in range (len(list)):
            list[i]= list[i] *100 / num_of_sequence
            output_str += str(i)+','+str(int(list[i]))+',\r\n'


        matrix = request.POST['matrix']
        tree_type = request.POST['tree']

        if 'database' in request.POST:
            sequence = Sequence()
            if request.user.is_authenticated:
                current_user = request.user
                print('current_user ' + str(current_user))
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


        print('str_text \n' + str_text)
        print('sequence lines length : \n'+ str(num_of_sequence))
        print('one sequence length : \n'+ str(sequence_length))



        upload_file_string = io.StringIO(str_text.replace("(", "").replace(")", ""))  # takes string as arg

        alignment_s = AlignIO.read(upload_file_string, 'fasta')

        alignment = AlignIO.MultipleSeqAlignment(alignment_s)

        subst = str(alignment.substitutions).replace(' ', '\xa0')
        context['substitutions'] = subst

        calculator = DistanceCalculator(matrix)
        constructor = DistanceTreeConstructor(calculator, tree_type)
        tree = constructor.build_tree(alignment)

        print("distance matrix \n" + str(constructor))
        print('csrf\n'+django.middleware.csrf.get_token(request))
        django_csrf = django.middleware.csrf.get_token(request)
        Phylo.write(tree, django_csrf+"converted.nwk", "newick")

        # tree = constructor.nj(dm)
        print("tree upgma")
        print(tree)

        Phylo.convert(django_csrf+"converted.nwk", "newick", "original.xml", "phyloxml")

        string1 = open(django_csrf+'converted.nwk', encoding='utf-8').read()

        Phylo.convert(django_csrf+"converted.nwk", "newick", django_csrf+"tree1.xml", "nexml")
        Phylo.convert(django_csrf+"converted.nwk", "newick", django_csrf+"tree1.nex", "nexus")
        Phylo.convert(django_csrf+"converted.nwk", "newick", django_csrf+"tree2.xml", "phyloxml")

        string2 = open(django_csrf+'tree1.xml', encoding='utf-8').read()
        string3 = open(django_csrf+'tree1.nex', encoding='utf-8').read()
        string4 = open(django_csrf+'tree2.xml', encoding='utf-8').read()

        print('result is: ')
        # print(result)
        if 'database' in request.POST:
            if request.user.is_authenticated:
                print('saving tree')
                sequence.nexmltree = json.dumps(string2)
                sequence.nexustree = json.dumps(string3)
                sequence.phyloxmltree = json.dumps(string4)
                sequence.tree = json.dumps(string1)
                sequence.save()

        context['newick'] = json.dumps(string1).replace("'","")
        context['alignment'] = alignment
        context['num_of_sequence'] = num_of_sequence
        context['sequence_length'] = sequence_length
        context['original_sequence'] = json.dumps(
            str_text.replace("(", "").replace(")", "").replace("\n", "<br>").replace("\r", ""))

        os.remove(django_csrf + "tree1.xml")
        os.remove(django_csrf + "tree1.nex")
        os.remove(django_csrf + "tree2.xml")
        os.remove(django_csrf + "converted.nwk")


    return render(request, 'index.html', context)


def upload2(request):

    context = {}
    return render(request, '', context)






def currentnode(request):
    print("starting subtree consensus")
    frontend_sequencies = str(request.POST.getlist('array[]'))
    consensus_threshold = str(request.POST.getlist('consensus'))

    frontend_sequencies = frontend_sequencies.replace('[', '').replace(']', '').replace(',', '\n').replace(' ', '').replace("'", '').replace('\\r','')
    consensus_threshold = consensus_threshold.replace('[', '').replace(']', '').replace(',', '\n').replace(' ', '').replace("'", '')

    print('frontend sequencies\n' + frontend_sequencies)
    print('consensus_threshold\n' + consensus_threshold)

    consensus_threshold = float(consensus_threshold) / 100

    in_memory_file = io.StringIO(frontend_sequencies)  # takes string as arg

    alignment_s = AlignIO.read(in_memory_file, 'fasta')
    alignment = AlignIO.MultipleSeqAlignment(alignment_s)
    consensus = AlignInfo.SummaryInfo(alignment_s).dumb_consensus(threshold=consensus_threshold, ambiguous='-', require_multiple=2)

    print("consensus from sequencies:")
    print(consensus)
    context = {}
    context['subtree_consensus'] = consensus.encode('utf8')

    return HttpResponse(consensus, status=200)


def register_request(request):
    if request.method == "POST":
        form = NewUserForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, "Registration successful.")
            # return redirect("login")
        else:
            messages.error(request, "Unsuccessful registration. Invalid information.")
    form = NewUserForm()
    return render(request=request, template_name="register.html", context={"register_form": form})


def login_request(request):
    if request.user.is_authenticated:
        current_user = request.user
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


def logout_request(request):
    logout(request)
    messages.info(request, "You have successfully logged out.")
    return redirect("/login")


def history(request):
    context = {}
    if request.user:
        current_user = request.user
        list = Sequence.objects.filter(author=current_user)
        context['sequence'] = list.values()

    return render(request, 'history.html', context)

def tooltip(request):

    return render(request, 'tooltip.html')

def delete(request):
    global id, current_user

    if request.user:
        current_user = request.user
        print('user\n'+ str(current_user.id))

    if request.method == "POST":
        id = str(request.POST.getlist('id')).replace('[','').replace("'","").replace("]","")
        print('delete id ' + id)

    obj = Sequence.objects.get(pk=id)
    if(obj.author.id==current_user.id):
        print('user is owner')
        Sequence.objects.filter(id=id).delete()

    return HttpResponse('true', status=200)


def getGapStatistics(request):
    global id
    if request.method == "POST":
        id = str(request.POST.getlist('id')).replace('[','').replace("'","").replace("]","")
    print('id ' + id)
    gap_statistic = Sequence.objects.get(pk=id).gap_statistics
    gap_statistic.replace("\n",'%0A')
    print('gapstats\n' + gap_statistic)
    return HttpResponse(gap_statistic, status=200)

def getSequenceString(request):
    global id
    if request.method == "POST":
        id = str(request.POST.getlist('id')).replace('[','').replace("'","").replace("]","")
    print('id ' + id)
    sequence = Sequence.objects.get(pk=id).sequence
    print('seq\n' + sequence)

    return HttpResponse(sequence, status=200)


def getNewickTree(request):
    global id
    if request.method == "POST":
        id = str(request.POST.getlist('id')).replace('[','').replace("'","").replace("]","")
    print('id ' + id)
    tree = Sequence.objects.get(pk=id).tree
    print('tree\n' + tree)

    return HttpResponse(tree, status=200)

def getNexusTree(request):
    global id
    if request.method == "POST":
        id = str(request.POST.getlist('id')).replace('[','').replace("'","").replace("]","")
    print('id ' + id)
    tree = Sequence.objects.get(pk=id).nexustree
    print('tree\n' + tree)

    return HttpResponse(tree, status=200)

def getNexmlTree(request):
    global id
    if request.method == "POST":
        id = str(request.POST.getlist('id')).replace('[','').replace("'","").replace("]","")
    print('id ' + id)
    tree = Sequence.objects.get(pk=id).nexmltree
    print('tree\n' + tree)

    return HttpResponse(tree, status=200)

def getPhyloxmlTree(request):
    global id
    if request.method == "POST":
        id = str(request.POST.getlist('id')).replace('[','').replace("'","").replace("]","")
    print('id ' + id)
    tree = Sequence.objects.get(pk=id).phyloxmltree
    print('tree\n' + tree)

    return HttpResponse(tree, status=200)

def sequenceAnalyzer(request):
    context = {}

    if request.method == 'POST':

        uploaded_file = request.FILES['document']
        print('uploadname ' + str(uploaded_file))
        num_of_sequence =0
        str_text = ''
        for line in uploaded_file:
            if line.decode != ' ':
                str_text = str_text + line.decode()

        frontend_sequencies = str_text
        num_of_sequence += len(str_text.splitlines())/2

        string_to_find = request.POST['string_to_find']
        zoom = request.POST['zoom_upload']
        context['zoom'] = zoom
        context['string_to_find'] = string_to_find
        print('zoom ' + zoom)
        print('str to find \n' +string_to_find)

        frontend_sequencies = frontend_sequencies.replace('[', '').replace(']', '')
        frontend_sequencies = frontend_sequencies.replace(',', '\n')
        frontend_sequencies = frontend_sequencies.replace(' ', '')
        frontend_sequencies = frontend_sequencies.replace("'", '')
        frontend_sequencies = frontend_sequencies.replace('\\r', '')

        sequence_length = str(len(frontend_sequencies.splitlines()[1]))
        print(str_text.splitlines()[1])
        result = [0] * (int(sequence_length))

        print('num of seq'+str(num_of_sequence))

        for line in frontend_sequencies.splitlines():
            if (not line.startswith('>')):
                for m in re.finditer(string_to_find, line):
                    for i in range(m.start(), m.end()):
                        result[i] += 1
                        print(string_to_find+' found', m.start(), m.end())
                        print('line')

        output_str = 'id,value,\n'

        for i in range(len(result)):
            result[i] = result[i] * 100 / num_of_sequence
            output_str += str(i) + ',' + str(int(result[i])) + ',\n'

        print(output_str)
        context['sequence_analyze'] = json.dumps(output_str)
        sequence = Sequence()
        sequence.gap_statistics = output_str
        print('num of seq' + str(num_of_sequence))

        context['sequence_length'] = json.dumps(sequence_length)
        context['sequence'] = json.dumps(str_text)

    return render(request, 'sequence_analyzer.html', context)


def sequenceAnalyzerJQuery(request):
    if request.method == 'POST':

        uploaded_file = request.POST['sequence']
        str_text = uploaded_file

        num_of_sequence = len(str_text.splitlines())/2

        frontend_sequencies = str_text

        string_to_find = request.POST['string_to_find']
        print('str to find \n' +string_to_find)

        sequence_length = str(len(frontend_sequencies.splitlines()[1]))
        print(str_text.splitlines()[1])
        result = [0] * (int(sequence_length))

        for line in frontend_sequencies.splitlines():
            if (not line.startswith('>')):
                for m in re.finditer(string_to_find, line):
                    for i in range(m.start(), m.end()):
                        result[i] += 1

        output_str = 'id,value,\n'

        for i in range(len(result)):
            result[i] = result[i] * 100 / num_of_sequence
            output_str += str(i) + ',' + str(int(result[i])) + ',\n'

    print('num of seq' + str(num_of_sequence))
    result = json.dumps(output_str)
    print('out'+output_str)
    return HttpResponse(result, status=200)






