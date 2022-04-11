"""djangoProjectDiplo URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path
from django.conf import settings

from myapp import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.login_request, name='login'),
    path('upload/', views.upload, name='upload'),
    path('upload/currentnode', views.currentnode, name='currentnode'),
    path('upload/options', views.options, name='options'),
    path("register", views.register_request, name="register"),
    path("login", views.login_request, name="login"),
    path("logout", views.logout_request, name="logout"),
    path("history", views.history, name="history"),
    path("history/delete", views.delete, name="delete"),
    path("gapstats", views.getGapStatistics, name="gapstats"),
    path("getsequence", views.getSequenceString, name="getsequence"),
    path("getnewicktree", views.getNewickTree, name="getnewick"),
    path("getnexustree", views.getNexusTree, name="getnexus"),
    path("getnexmltree", views.getNexmlTree, name="getnexml"),
    path("getphyloxmltree", views.getPhyloxmlTree, name="getphyloxml"),
    path("sequenceanalyzer", views.sequenceAnalyzer, name="sequenceanalyzer"),
    path("sequenceanalyzervariable", views.sequenceAnalyzerJQuery, name="sequenceanalyzervariable"),
    path("tooltip", views.tooltip, name="tooltip"),

    # path('consensus/', views.consensus, name='consensus'),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
