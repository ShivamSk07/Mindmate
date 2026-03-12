import json
import os
from django.shortcuts import render, redirect
from django.http import JsonResponse, StreamingHttpResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from .models import Persona, UserProfile, Conversation, Message
from django.db import models
from groq import Groq

def signup(request):
    if request.user.is_authenticated:
        return redirect('index')
    if request.method == 'POST':
        u = request.POST.get('username')
        e = request.POST.get('email')
        p = request.POST.get('password')
        if User.objects.filter(username=u).exists():
            return render(request, 'chat/signup.html', {'error': 'Username already exists'})
        user = User.objects.create_user(username=u, email=e, password=p)
        UserProfile.objects.create(user=user)
        login(request, user)
        return redirect('index')
    return render(request, 'chat/signup.html')

def user_login(request):
    if request.user.is_authenticated:
        return redirect('index')
    if request.method == 'POST':
        u = request.POST.get('username')
        p = request.POST.get('password')
        user = authenticate(request, username=u, password=p)
        if user is not None:
            login(request, user)
            return redirect('index')
        else:
            return render(request, 'chat/login.html', {'error': 'Invalid credentials'})
    return render(request, 'chat/login.html')

def user_logout(request):
    logout(request)
    return redirect('login')

@login_required(login_url='login')
def index(request):
    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return render(request, 'chat/index.html', {'user': user, 'profile': profile})


@csrf_exempt
@login_required(login_url='login')
def profile_view(request):
    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return render(request, 'chat/profile.html', {'user': user, 'profile': profile})

@csrf_exempt
@login_required(login_url='login')
def save_settings(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
        except Exception:
            data = request.POST
        
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        
        username = data.get('username', user.username).strip()
        if username:
            user.username = username
            user.save()
        
        theme = data.get('theme_preference', profile.theme_preference)
        font_size = data.get('font_size', profile.font_size)
        bubble_style = data.get('bubble_style', profile.bubble_style)
        language = data.get('language', profile.language)
        
        profile.theme_preference = theme
        profile.font_size = font_size
        profile.bubble_style = bubble_style
        profile.language = language
        profile.save()
        
        return JsonResponse({'status': 'ok', 'theme': theme, 'username': user.username})
    return JsonResponse({'error': 'Invalid'}, status=400)

@login_required(login_url='login')
def get_conversations(request):
    user = request.user
    convs = Conversation.objects.filter(user=user).order_by('-updated_at')
    data = []
    for c in convs:
        data.append({
            'id': c.id,
            'title': c.title,
            'is_pinned': c.is_pinned,
            'folder': c.folder,
            'active_persona_id': c.active_persona.id if c.active_persona else None
        })
    return JsonResponse({'conversations': data})

@login_required(login_url='login')
def get_messages(request, conv_id):
    user = request.user
    try:
        conv = Conversation.objects.get(id=conv_id, user=user)
        messages = conv.messages.all()
        data = [{'id': m.id, 'role': m.role, 'content': m.content, 'reaction': m.reaction, 'confidence': m.confidence} for m in messages]
        return JsonResponse({'messages': data})
    except Conversation.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)
@login_required
def get_personas(request):
    user_personas = Persona.objects.filter(models.Q(is_custom=False) | models.Q(created_by=request.user)).order_by(
        models.Case(models.When(name='MindMate', then=models.Value(0)), default=models.Value(1)),
        'name'
    )
    data = [{'id': p.id, 'name': p.name, 'tone': p.tone, 'color_theme': p.color_theme, 'system_prompt': p.system_prompt, 'is_custom': p.is_custom} for p in user_personas]
    return JsonResponse({'personas': data})

@csrf_exempt
@login_required
def create_persona(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        persona = Persona.objects.create(
            name=data.get('name'),
            system_prompt=data.get('system_prompt'),
            tone=data.get('tone', 'Custom'),
            is_custom=True,
            created_by=request.user
        )
        return JsonResponse({'success': True, 'id': persona.id})
    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
@login_required
def edit_persona(request, persona_id):
    if request.method == 'POST':
        try:
            persona = Persona.objects.get(id=persona_id, created_by=request.user, is_custom=True)
            data = json.loads(request.body)
            persona.name = data.get('name', persona.name)
            persona.system_prompt = data.get('system_prompt', persona.system_prompt)
            persona.tone = data.get('tone', persona.tone)
            persona.save()
            return JsonResponse({'success': True})
        except Persona.DoesNotExist:
            return JsonResponse({'error': 'Persona not found or unauthorized'}, status=403)
    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
@login_required
def delete_persona(request, persona_id):
    if request.method == 'POST':
        try:
            persona = Persona.objects.get(id=persona_id, created_by=request.user, is_custom=True)
            persona.delete()
            return JsonResponse({'success': True})
        except Persona.DoesNotExist:
            return JsonResponse({'error': 'Persona not found or unauthorized'}, status=403)
    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
def switch_persona(request):
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        user = request.user
        data = json.loads(request.body)
        conv_id = data.get('conversation_id')
        persona_id = data.get('persona_id')
        try:
            conv = Conversation.objects.get(id=conv_id, user=user)
            persona = Persona.objects.get(id=persona_id)
            conv.active_persona = persona
            conv.save()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
def chat_api(request):
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        user = request.user
        data = json.loads(request.body)
        user_message = data.get('message')
        conv_id = data.get('conversation_id')
        persona_id = data.get('persona_id')
        folder_name = data.get('folder')

        from django.conf import settings
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)

        # Get or create conversation
        if conv_id:
            try:
                conv = Conversation.objects.get(id=conv_id, user=user)
            except Conversation.DoesNotExist:
                return JsonResponse({'error': 'Conversation not found'}, status=404)
        else:
            persona = Persona.objects.filter(id=persona_id).first() if persona_id else (Persona.objects.filter(name='MindMate').first() or Persona.objects.first())
            
            # Smart Title Generation using Groq
            try:
                title_res = client.chat.completions.create(
                    messages=[{"role": "user", "content": f"Generate a very short 2-4 word title for this message. No quotes, no markdown: {user_message}"}],
                    model="llama-3.1-8b-instant",
                    temperature=0.3
                )
                smart_title = title_res.choices[0].message.content.strip().replace('"', '')
            except Exception as e:
                if 'quota' in str(e).lower() or 'rate' in str(e).lower():
                    smart_title = "Under Maintenance"
                else:
                    smart_title = "New Conversation"
                
            conv = Conversation.objects.create(
                user=user, 
                title=smart_title, 
                active_persona=persona, 
                folder=folder_name if folder_name else ''
            )
            conv_id = conv.id

        # Save user message
        Message.objects.create(conversation=conv, role='user', content=user_message)
        
        profile, _ = UserProfile.objects.get_or_create(user=user)

        # Build message history for Groq
        messages = conv.messages.order_by('created_at')
        api_messages = []
        
        base_sys_msg = (
            "You are MindMate, a premium AI companion. "
            "LANGUAGE POLICY: Strictly respond in the SAME language as the user's message. "
            "- If the user speaks in English, you must respond ONLY in English. Do not mix Hindi/Hinglish. "
            "- If the user speaks in Hindi or Hinglish, respond in natural Hinglish. "
            "LOGICAL COHERENCE: Everything you say must follow a stable line of thought and maintain logical flow. "
            "MEANINGFUL HINGLISH: When using Hinglish, ensure sentences are meaningful and avoid word salads. "
            "NO TRANSLATIONS: Never repeat the same thought in two different languages. "
            "AUTONOMOUS MEMORY: Use the 'Memory Vault' to keep responses personal. "
            "IDENTITY: You are MindMate, created by Shivam Kothekar. "
        )
        sys_msg = base_sys_msg
        
        if conv.active_persona:
            memory_vault = profile.memory_vault
            persona_prompt = conv.active_persona.system_prompt
            sys_msg = (
                f"{base_sys_msg}\n\n"
                f"### USER'S PERSONAL INFO (MEMORY VAULT):\n{memory_vault if memory_vault else 'No memories yet. Ask the user questions to get to know them!'}\n\n"
                f"### CURRENT PERSONA: {conv.active_persona.name}\n"
                f"STRICT PERSONA INSTRUCTIONS: {persona_prompt}\n\n"
                "STRICT ADHERENCE: You must perfectly adopt the persona while maintaining extreme logical stability. Do not make random statements."
            )
        
        # Add system prompt as the very first message
        api_messages.append({'role': 'system', 'content': sys_msg})
            
        for m in messages.order_by('-created_at')[:10]: # last 10 messages context
            api_messages.insert(1, {'role': m.role, 'content': m.content})


        def stream_response():
            try:
                chat_completion = client.chat.completions.create(
                    messages=api_messages,
                    model="llama-3.1-8b-instant",
                    temperature=0.6,
                    stream=True
                )
                
                full_response = ""
                for chunk in chat_completion:
                    content = chunk.choices[0].delta.content
                    if content:
                        full_response += content
                        # Yield in Server-Sent Events format
                        yield f"data: {json.dumps({'content': content})}\n\n"
                
                # After streaming, save to DB
                Message.objects.create(conversation=conv, role='assistant', content=full_response)
                
                # --- AUTO-MEMORY UPDATE ---
                try:
                    # Async-like memory extraction (non-blocking for user since stream is done)
                    m_vault = profile.memory_vault if profile.memory_vault else ""
                    extract_prompt = (
                        "You are an information extraction expert. Below is the current 'Memory Vault' of user details and the latest chat exchange. "
                        "Update the memory vault with NEW important facts about the user (name, location, habits, likes, personal details). "
                        f"### CURRENT MEMORY:\n{m_vault}\n\n"
                        f"### LATEST USER MSG: {user_message}\n"
                        f"### ASSISTANT REPLY: {full_response}\n\n"
                        "CRITICAL: Output ONLY the updated list of facts as concise bullet points. No conversational text. If no new info, repeat current memory."
                    )
                    mem_res = client.chat.completions.create(
                        messages=[{"role": "system", "content": extract_prompt}],
                        model="llama-3.1-8b-instant",
                        temperature=0.1
                    )
                    new_m = mem_res.choices[0].message.content.strip()
                    if new_m and len(new_m) > 5:
                        profile.memory_vault = new_m
                        profile.save()
                except Exception as e:
                    print(f"Memory extraction error: {e}")

                yield f"data: {json.dumps({'done': True, 'conversation_id': conv.id})}\n\n"
            except Exception as e:
                err_msg = str(e)
                if 'quota' in err_msg.lower() or 'rate_limit' in err_msg.lower():
                    yield f"data: {json.dumps({'content': '⚠️ **MindMate is currently experiencing high demand.** We are scaling up to better serve you. Please try again in a few moments.'})}\n\n"
                    yield f"data: {json.dumps({'done': True, 'conversation_id': conv.id})}\n\n"
                else:
                    yield f"data: {json.dumps({'error': err_msg})}\n\n"

        return StreamingHttpResponse(stream_response(), content_type='text/event-stream')
    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
@login_required
def clear_history(request):
    Conversation.objects.filter(user=request.user).delete()
    return JsonResponse({'success': True})

@login_required
def export_chat(request, conv_id):
    try:
        conv = Conversation.objects.get(id=conv_id, user=request.user)
        messages = conv.messages.all()
        text = f"Title: {conv.title}\n\n"
        for m in messages:
            text += f"{m.role.upper()}: {m.content}\n\n"
        return HttpResponse(text, content_type='text/plain')
    except:
        return HttpResponse('Error')

@login_required
def export_all_chats(request):
    try:
        convs = Conversation.objects.filter(user=request.user)
        text = "--- MINDMATE CHAT EXPORT ---\n\n"
        for conv in convs:
            text += f"=== Conversation: {conv.title} ===\n"
            for m in conv.messages.all():
                text += f"{m.role.upper()}: {m.content}\n\n"
            text += "\n"
        response = HttpResponse(text, content_type='text/plain')
        response['Content-Disposition'] = 'attachment; filename="all_chats_export.txt"'
        return response
    except:
        return HttpResponse('Error generating export')

@csrf_exempt
@login_required
def update_memory(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.memory_vault = data.get('memory_vault', '')
        profile.save()
        return JsonResponse({'success': True})
    return JsonResponse({'error': 'Invalid request'}, status=400)
