import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    kotlin("android")
    kotlin("plugin.serialization")
}

android {
    namespace = "com.mementolife.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.mementolife.app"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    sourceSets {
        getByName("main") {
            kotlin.srcDirs("src/main/kotlin")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

    testImplementation("junit:junit:4.13.2")
}

// El diseño y el dataset viven en render-core/ y content/, fuera de android/,
// para que no exista una segunda copia de la verdad. Esta tarea los sincroniza
// a assets/ en cada build; el contenido copiado no se versiona (ver .gitignore).
val copyDesignAndContentAssets by tasks.registering(Copy::class) {
    from(rootProject.projectDir.resolve("../render-core/design-tokens.json")) {
        into("render-core")
    }
    from(rootProject.projectDir.resolve("../content/efemerides")) {
        include("es.json", "en.json")
        into("efemerides")
    }
    into(layout.projectDirectory.dir("src/main/assets"))
}

tasks.named("preBuild") {
    dependsOn(copyDesignAndContentAssets)
}
